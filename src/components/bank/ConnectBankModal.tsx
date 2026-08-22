"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, ShieldCheck, Loader2, Landmark, Check } from "lucide-react";
import { AnimatedModal, AnimatedButton } from "@/components/motion";
import { toast } from "@/components/ui/toast-store";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { institutionsForRegion, type Institution } from "@/lib/bank/banks";
import { connectInstitution, type ConnectResult } from "@/lib/bank/connect";

type Step = "pick" | "connecting" | "done";

/**
 * Add a bank, UPI app or wallet to Renew. Nothing is faked — this creates a real
 * account you own; its balance and transactions come only from real activity you
 * record or a real bank feed once connected. No passwords or card details are
 * ever asked here.
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
    setResult(null);
  }
  function close() {
    onClose();
    setTimeout(reset, 250);
  }

  async function choose(inst: Institution) {
    if (!user?.uid) {
      toast({ title: "Please sign in again", variant: "error" });
      return;
    }
    setActive(inst);
    setStep("connecting");
    try {
      const [r] = await Promise.all([
        connectInstitution(user.uid, { institution: inst, currency: prefs.currency }),
        new Promise((res) => setTimeout(res, 900)),
      ]);
      setResult(r);
      setStep("done");
      onConnected?.(r);
    } catch {
      toast({ title: "Couldn't add it — please try again", variant: "error" });
      setStep("pick");
    }
  }

  const title = step === "pick" ? "Add your bank" : step === "connecting" ? "Connecting" : "Added";

  return (
    <AnimatedModal open={open} onClose={close} title={title}>
      {step === "pick" && (
        <div className="flex flex-col">
          <p className="text-muted -mt-1 mb-4 text-sm">
            Add the bank, UPI app or wallet where your money lives, so Renew can track it in one place.
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
            <span>Private &amp; secure. Renew never asks for your password or card details, and only ever tracks real money.</span>
          </div>
        </div>
      )}

      {step === "connecting" && active && (
        <div className="flex flex-col items-center py-8">
          <div className="relative mb-6 grid size-20 place-items-center">
            <motion.span
              className="absolute inset-0 rounded-3xl"
              style={{ backgroundColor: active.color, opacity: 0.18 }}
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="grid size-16 place-items-center rounded-2xl text-lg font-semibold text-white" style={{ backgroundColor: active.color }}>
              {active.short}
            </span>
          </div>
          <p className="text-strong flex items-center gap-2 text-sm font-medium">
            <Loader2 className="size-4 animate-spin text-[var(--color-gold-500)]" />
            Adding {active.name}…
          </p>
        </div>
      )}

      {step === "done" && result && active && (
        <div className="flex flex-col items-center py-3 text-center">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="mb-4 grid size-16 place-items-center rounded-full bg-emerald-500/15"
          >
            <Check className="size-7 text-emerald-400" />
          </motion.div>
          <h3 className="text-strong text-lg font-medium">{result.accountName} is in Renew</h3>
          <p className="text-muted mt-1 max-w-xs text-sm">
            Start adding your money — by tap, scan or voice — and Renew keeps it organised, categorised and clear.
          </p>
          <AnimatedButton size="lg" className="mt-6 w-full max-w-xs" onClick={close}>
            Start tracking
          </AnimatedButton>
          <p className="text-muted mt-3 inline-flex items-center gap-1.5 text-xs">
            <Landmark className="size-3" />Only real money, always.
          </p>
        </div>
      )}
    </AnimatedModal>
  );
}
