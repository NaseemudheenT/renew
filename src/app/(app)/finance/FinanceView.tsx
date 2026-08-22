"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { Landmark, ShieldCheck, RefreshCw, Trash2, Search, Check, FlaskConical, ChevronRight, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { AnimatedButton, AnimatedModal } from "@/components/motion";
import { CountrySelect } from "@/components/ui/CountrySelect";
import { toast } from "@/components/ui/toast-store";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useReauth } from "@/components/security/ReauthProvider";
import { usePrivacy } from "@/components/providers/PrivacyProvider";
import { sandboxProvider, listSandboxConnections, getSandboxDetail } from "@/lib/finance-connect/sandbox";
import { isSandbox } from "@/lib/finance-connect/provider";
import type { ProviderInstitution } from "@/lib/finance-connect/provider";
import { institutionsForRegion } from "@/lib/bank/banks";
import { cn } from "@/lib/utils";

const CHANGE_EVENT = "renew-sandbox-bank-change";

function useConnections() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener(CHANGE_EVENT, cb);
      window.addEventListener("storage", cb);
      return () => {
        window.removeEventListener(CHANGE_EVENT, cb);
        window.removeEventListener("storage", cb);
      };
    },
    () => JSON.stringify(listSandboxConnections()),
    () => "[]",
  );
}

export function FinanceView() {
  const { prefs, money, shortDate } = useLocale();
  const { hidden, mask } = usePrivacy();
  const { user } = useAuth();
  const requireReauth = useReauth();
  const connectionsJson = useConnections();
  const connections = useMemo(() => JSON.parse(connectionsJson) as ReturnType<typeof listSandboxConnections>, [connectionsJson]);
  const sandbox = isSandbox();

  const [open, setOpen] = useState(false);

  async function openConnect() {
    if (!(await requireReauth("to connect a bank"))) return;
    setOpen(true);
  }

  async function disconnect(id: string) {
    if (!(await requireReauth("to disconnect this bank"))) return;
    await sandboxProvider.disconnect(id);
    toast({ title: "Disconnected & consent revoked" });
  }
  async function refresh(id: string) {
    await sandboxProvider.refreshConnection(id);
    toast({ title: "Synced", variant: "success" });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Bank connections"
        subtitle="Connect a bank securely — Renew never sees your password or card details."
        action={<AnimatedButton onClick={openConnect}><Landmark className="size-4" />Connect a bank</AnimatedButton>}
      />

      {sandbox && (
        <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm">
          <FlaskConical className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <p className="text-body"><span className="font-medium text-[var(--text-strong)]">Sandbox mode.</span> This is a safe test of the real connect experience — no live bank, no real money. A licensed provider activates live data.</p>
        </div>
      )}

      {connections.length === 0 ? (
        <GlassCard padded>
          <EmptyState icon={Landmark} title="No banks connected" description="Connect a bank to see balances and transactions here. You'll authorize on your bank's own secure page — Renew only ever receives read-only, consented data." action={<AnimatedButton onClick={openConnect}><Landmark className="size-4" />Connect a bank</AnimatedButton>} />
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-4">
          {connections.map((c) => {
            const detail = getSandboxDetail(c.id);
            const bal = detail?.balances ?? [];
            return (
              <GlassCard key={c.id} padded>
                <div className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[var(--glass-bg-strong)]"><Landmark className="size-5 text-[var(--color-gold-500)]" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-strong truncate text-sm font-medium">{c.institutionName}</p>
                      {c.sandbox && <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-1.5 py-0.5 text-[0.6rem] font-medium text-amber-600 dark:text-amber-300">SANDBOX</span>}
                    </div>
                    <p className="text-muted text-xs">
                      <span className={cn("inline-flex items-center gap-1", c.status === "active" ? "text-emerald-500" : "text-[var(--text-muted)]")}>
                        <span className={cn("size-1.5 rounded-full", c.status === "active" ? "bg-emerald-500" : "bg-[var(--text-muted)]")} />{c.status === "active" ? "Connected" : c.status}
                      </span>
                      {c.lastSyncedAt ? ` · Synced ${shortDate(c.lastSyncedAt)}` : ""}
                    </p>
                  </div>
                  <button type="button" onClick={() => refresh(c.id)} aria-label="Sync" className="grid size-9 place-items-center rounded-full text-[var(--text-muted)] hover:bg-[var(--glass-bg-soft)] hover:text-[var(--text-strong)]"><RefreshCw className="size-4" /></button>
                  <button type="button" onClick={() => disconnect(c.id)} aria-label="Disconnect" className="grid size-9 place-items-center rounded-full text-[var(--text-muted)] hover:bg-rose-500/10 hover:text-rose-500"><Trash2 className="size-4" /></button>
                </div>

                {detail && detail.accounts.length > 0 && (
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {detail.accounts.map((a) => {
                      const b = bal.find((x) => x.accountId === a.id);
                      return (
                        <li key={a.id} className="flex items-center justify-between rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-2.5">
                          <div className="min-w-0">
                            <p className="text-body truncate text-sm">{a.name}</p>
                            <p className="text-muted text-xs capitalize">{a.kind.replace("_", " ")} · {a.maskedNumber}</p>
                          </div>
                          {b && <span className="text-strong shrink-0 text-sm font-medium tabular-nums">{hidden ? mask : money(b.current, b.currency)}</span>}
                        </li>
                      );
                    })}
                  </ul>
                )}
                <p className="text-muted mt-3 inline-flex items-center gap-1.5 text-xs"><ShieldCheck className="size-3.5 text-[var(--color-gold-500)]" />Read-only consent · revoke any time by disconnecting</p>
              </GlassCard>
            );
          })}
        </div>
      )}

      <ConnectFlow open={open} onClose={() => setOpen(false)} region={prefs.region} uid={user?.uid ?? null} />
    </div>
  );
}

type FlowStep = "pick" | "authorize" | "done";

function ConnectFlow({ open, onClose, region, uid }: { open: boolean; onClose: () => void; region: string; uid: string | null }) {
  const [step, setStep] = useState<FlowStep>("pick");
  const [reg, setReg] = useState(region);
  const [q, setQ] = useState("");
  const [active, setActive] = useState<ProviderInstitution | null>(null);
  const [connId, setConnId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const insts = useMemo<ProviderInstitution[]>(
    () => institutionsForRegion(reg).map((i) => ({ id: i.id, name: i.name, region: reg, short: i.short, color: i.color })),
    [reg],
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? insts.filter((i) => i.name.toLowerCase().includes(s)) : insts;
  }, [insts, q]);

  function reset() {
    setStep("pick");
    setQ("");
    setActive(null);
    setConnId(null);
    setBusy(false);
  }
  function close() {
    onClose();
    setTimeout(reset, 250);
  }

  async function pick(inst: ProviderInstitution) {
    if (!uid) return;
    setActive(inst);
    setBusy(true);
    try {
      const init = await sandboxProvider.createConnection({ uid, institutionId: inst.id, region: reg, scopes: ["accounts", "balances", "transactions"] });
      setConnId(init.connectionId);
      setStep("authorize");
    } finally {
      setBusy(false);
    }
  }

  async function approve() {
    if (!connId) return;
    setBusy(true);
    try {
      await sandboxProvider.handleCallback({ connectionId: connId, params: {} });
      setStep("done");
    } catch {
      toast({ title: "Couldn't complete — try again", variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  const title = step === "pick" ? "Connect a bank" : step === "authorize" ? "Authorize" : "Connected";

  return (
    <AnimatedModal open={open} onClose={close} title={title}>
      {step === "pick" && (
        <div className="flex flex-col gap-3">
          <CountrySelect label="Country / region" value={reg} onChange={setReg} locale={reg} />
          <div className="flex items-center gap-2 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5">
            <Search className="size-4 shrink-0 text-[var(--text-muted)]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your bank…" aria-label="Search bank" className="h-11 flex-1 bg-transparent text-sm text-[var(--text-strong)] placeholder:text-[var(--text-muted)] focus:outline-none" />
          </div>
          <div className="grid max-h-[40vh] grid-cols-2 gap-2 overflow-y-auto pr-0.5 sm:grid-cols-3">
            {filtered.map((inst) => (
              <button key={inst.id} type="button" onClick={() => pick(inst)} disabled={busy} className="group flex items-center gap-2.5 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] p-2.5 text-left transition-colors hover:border-[var(--focus-ring)]/60">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl text-[0.7rem] font-semibold text-white" style={{ backgroundColor: inst.color }}>{inst.short}</span>
                <span className="text-body min-w-0 flex-1 truncate text-[0.82rem] font-medium">{inst.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "authorize" && active && (
        <div className="flex flex-col items-center py-4 text-center">
          <span className="grid size-16 place-items-center rounded-2xl text-lg font-semibold text-white" style={{ backgroundColor: active.color }}>{active.short}</span>
          <h3 className="text-strong mt-4 text-base font-medium">Authorize {active.name}</h3>
          <p className="text-muted mt-1 max-w-xs text-sm">On a real connection you&apos;d sign in on {active.name}&apos;s own secure page and approve read-only access. Renew never sees your credentials.</p>
          <div className="text-muted mt-4 flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs"><FlaskConical className="size-3.5 text-amber-500" />Sandbox — approve to simulate</div>
          <AnimatedButton size="lg" className="mt-5 w-full max-w-xs" onClick={approve} loading={busy}>Approve access <ChevronRight className="size-4" /></AnimatedButton>
        </div>
      )}

      {step === "done" && active && (
        <div className="flex flex-col items-center py-4 text-center">
          <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }} className="grid size-16 place-items-center rounded-full bg-emerald-500/15"><Check className="size-7 text-emerald-400" /></motion.div>
          <h3 className="text-strong mt-4 text-lg font-medium">{active.name} connected</h3>
          <p className="text-muted mt-1 text-sm">Your accounts and balances are in Renew. Manage or disconnect any time.</p>
          <AnimatedButton size="lg" className="mt-5 w-full max-w-xs" onClick={close}>Done</AnimatedButton>
        </div>
      )}

      {busy && step === "pick" && (
        <div className="text-muted mt-2 flex items-center justify-center gap-2 text-sm"><Loader2 className="size-4 animate-spin" />Starting secure connection…</div>
      )}
    </AnimatedModal>
  );
}
