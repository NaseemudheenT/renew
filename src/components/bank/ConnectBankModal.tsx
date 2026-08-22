"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Check, ShieldCheck, Sparkles, Loader2, Landmark } from "lucide-react";
import { AnimatedModal, AnimatedButton } from "@/components/motion";
import { toast } from "@/components/ui/toast-store";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { institutionsForRegion, type Institution } from "@/lib/bank/banks";
import { connectInstitution, type ConnectResult } from "@/lib/bank/connect";
import { cn } from "@/lib/utils";

type Step = "pick" | "syncing" | "done";

const SYNC_LINES = [
  "Establishing a secure connection",
  "Verifying your bank",
  "Fetching your last 75 days",
  "Sorting & categorising every transaction",
  "Finding your bills & subscriptions",
];

/**
 * Renew's connect-a-bank experience: choose an institution, watch a calm secure
 * sync, and land back with the whole app already filled in. No passwords are
 * ever asked here — the real handshake happens with the bank's own provider.
 */
export function ConnectBankModal({
  open,
  onClose,
  onConnected,
}: {
  open: boolean;
  onClose: () => void;
  onConnected?: (r: ConnectResult) => void;
}) {
  const { user } = useAuth();
  const { prefs } = useLocale();
  const [step, setStep] = useState<Step>("pick");
  const [q, setQ] = useState("");
  const [active, setActive] = useState<Institution | null>(null);
  const [line, setLine] = useState(0);
  const [result, setResult] = useState<ConnectResult | null>(null);

  const list = useMemo(() => institutionsForRegion(prefs.region), [prefs.region]);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? list.filter((i) => i.name.toLowerCase().includes(s)) : list;
  }, [list, q]);

  function reset() {
    setStep("pick");
    setQ("");
    setActive(null);
    setLine(0);
    setResult(null);
  }
  function close() {
    onClose();
    // let the close animation play before resetting internal state
    setTimeout(reset, 250);
  }

  async function choose(inst: Institution) {
    if (!user?.uid) {
      toast({ title: "Please sign in again", variant: "error" });
      return;
    }
    setActive(inst);
    setStep("syncing");
    setLine(0);
    const timer = setInterval(() => setLine((l) => Math.min(l + 1, SYNC_LINES.length - 1)), 520);
    try {
      const [r] = await Promise.all([
        connectInstitution(user.uid, { institution: inst, currency: prefs.currency }),
        new Promise((res) => setTimeout(res, SYNC_LINES.length * 520 + 300)),
      ]);
      clearInterval(timer);
      setResult(r);
      setStep("done");
      onConnected?.(r);
    } catch {
      clearInterval(timer);
      toast({ title: "Couldn't connect — please try again", variant: "error" });
      setStep("pick");
    }
  }

  const title = step === "pick" ? "Connect your bank" : step === "syncing" ? "Connecting securely" : "You're all set";

  return (
    <AnimatedModal open={open} onClose={close} title={title}>
      {step === "pick" && (
        <div className="flex flex-col">
          <p className="text-muted -mt-1 mb-4 text-sm">
            Choose where your money lives. Renew reads it, keeps it in sync and sorts everything — you never type a transaction again.
          </p>
          <div className="mb-3 flex items-center gap-2 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5">
            <Search className="size-4 shrink-0 text-[var(--text-muted)]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search your bank or UPI app…"
              autoFocus
              aria-label="Search bank"
              className="h-11 flex-1 bg-transparent text-sm text-[var(--text-strong)] placeholder:text-[var(--text-muted)] focus:outline-none"
            />
          </div>
          <div className="grid max-h-[46vh] grid-cols-2 gap-2 overflow-y-auto pr-0.5 sm:grid-cols-3">
            {filtered.map((inst) => (
              <button
                key={inst.id}
                type="button"
                onClick={() => choose(inst)}
                className="group flex items-center gap-2.5 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] p-2.5 text-left transition-colors hover:border-[var(--focus-ring)]/60"
              >
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-xl text-[0.7rem] font-semibold text-white shadow-sm"
                  style={{ backgroundColor: inst.color }}
                >
                  {inst.short}
                </span>
                <span className="text-body min-w-0 flex-1 truncate text-[0.82rem] font-medium group-hover:text-[var(--text-strong)]">
                  {inst.name}
                </span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-muted col-span-full py-8 text-center text-sm">No match — try another name.</p>
            )}
          </div>
          <div className="text-muted mt-4 flex items-start gap-2 text-xs">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[var(--color-gold-500)]" />
            <span>Bank-grade encryption. Renew is read-only — it can never move your money. Preview data until live bank connections open in your region.</span>
          </div>
        </div>
      )}

      {step === "syncing" && active && (
        <div className="flex flex-col items-center py-4">
          <div className="relative mb-6 grid size-20 place-items-center">
            <motion.span
              className="absolute inset-0 rounded-3xl"
              style={{ backgroundColor: active.color, opacity: 0.18 }}
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="grid size-16 place-items-center rounded-2xl text-lg font-semibold text-white" style={{ backgroundColor: active.color }}>
              {active.short}
            </span>
          </div>
          <p className="text-strong mb-5 text-sm font-medium">{active.name}</p>
          <ul className="flex w-full max-w-sm flex-col gap-2.5">
            {SYNC_LINES.map((text, i) => {
              const state = i < line ? "done" : i === line ? "active" : "todo";
              return (
                <li key={text} className="flex items-center gap-3">
                  <span className={cn("grid size-5 shrink-0 place-items-center rounded-full border transition-colors", state === "done" ? "border-emerald-400/50 bg-emerald-500/15" : state === "active" ? "border-[var(--focus-ring)] bg-[var(--field-bg)]" : "border-[var(--field-border)]")}>
                    {state === "done" ? <Check className="size-3 text-emerald-400" /> : state === "active" ? <Loader2 className="size-3 animate-spin text-[var(--color-gold-500)]" /> : null}
                  </span>
                  <span className={cn("text-sm transition-colors", state === "todo" ? "text-[var(--text-muted)]" : "text-[var(--text-body)]")}>{text}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {step === "done" && result && (
        <div className="flex flex-col items-center py-3 text-center">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="mb-4 grid size-16 place-items-center rounded-full bg-emerald-500/15"
          >
            <Sparkles className="size-7 text-emerald-400" />
          </motion.div>
          <h3 className="text-strong text-lg font-medium">Your money is in Renew</h3>
          <p className="text-muted mt-1 text-sm">
            Synced {result.transactions} transactions, {result.bills} bills and {result.subscriptions} subscriptions — all sorted for you.
          </p>
          <div className="mt-5 grid w-full max-w-xs grid-cols-3 gap-2">
            <Stat n={result.transactions} label="transactions" />
            <Stat n={result.bills} label="bills" />
            <Stat n={result.subscriptions} label="subs" />
          </div>
          <AnimatedButton size="lg" className="mt-6 w-full max-w-xs" onClick={close}>
            See your money
          </AnimatedButton>
          <p className="text-muted mt-3 inline-flex items-center gap-1.5 text-xs">
            <Landmark className="size-3" />Renew keeps this in sync from now on.
          </p>
        </div>
      )}
    </AnimatedModal>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] p-2.5">
      <p className="text-strong text-lg font-semibold tabular-nums">{n}</p>
      <p className="text-muted text-[0.7rem]">{label}</p>
    </div>
  );
}
