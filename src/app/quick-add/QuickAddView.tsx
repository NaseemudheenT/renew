"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ArrowRight, Plus } from "lucide-react";
import { RenewMark } from "@/components/brand/RenewMark";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedButton } from "@/components/motion";
import { toast } from "@/components/ui/toast-store";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { categoriesFor } from "@/lib/finance";
import { createTransaction } from "@/lib/firestore/transactions";
import { formatAmountTyping, parseAmount, groupingLocale } from "@/lib/amount-format";
import { nowMs } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { TxType } from "@/lib/types";

const EXPENSE = categoriesFor("expense").slice(0, 8);
const INCOME = categoriesFor("income").slice(0, 6);

export function QuickAddView() {
  const router = useRouter();
  const { user } = useAuth();
  const { prefs, money } = useLocale();
  const uid = user?.uid ?? null;

  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(EXPENSE[0]!.id);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<number | null>(null);

  const cats = type === "expense" ? EXPENSE : INCOME;
  const loc = useMemo(() => groupingLocale(prefs.region, prefs.currency), [prefs.region, prefs.currency]);

  function pickType(next: TxType) {
    setType(next);
    setCategory((next === "expense" ? EXPENSE : INCOME)[0]!.id);
  }

  async function save() {
    const amt = parseAmount(amount);
    if (!uid || !amt || amt <= 0) return;
    setSaving(true);
    try {
      await createTransaction(uid, { type, amount: amt, currency: prefs.currency, category, date: nowMs() });
      setSaved(amt);
    } catch {
      toast({ title: "Couldn't save — try again", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  function again() {
    setSaved(null);
    setAmount("");
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-5 py-8">
      <Link href="/dashboard" className="mb-6 flex items-center gap-2" aria-label="Renew home">
        <RenewMark size={28} />
      </Link>

      {saved !== null ? (
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm">
          <GlassCard padded className="text-center">
            <span className="mx-auto mb-3 grid size-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-500"><Check className="size-7" /></span>
            <p className="text-strong text-lg font-medium">Saved</p>
            <p className="text-muted mt-1 text-sm">{type === "income" ? "+" : "−"}{money(saved, prefs.currency)} added to your account.</p>
            <div className="mt-5 flex flex-col gap-2">
              <AnimatedButton size="lg" fullWidth onClick={again}><Plus className="size-4" />Add another</AnimatedButton>
              <AnimatedButton size="lg" fullWidth variant="glass" onClick={() => router.push("/dashboard")}>Done<ArrowRight className="size-4" /></AnimatedButton>
            </div>
          </GlassCard>
        </motion.div>
      ) : (
        <div className="w-full max-w-sm">
          <GlassCard padded>
            <div className="mb-4 inline-flex rounded-full border border-[var(--field-border)] bg-[var(--field-bg)] p-1 text-sm">
              {(["expense", "income"] as TxType[]).map((tt) => (
                <button key={tt} type="button" onClick={() => pickType(tt)} aria-pressed={type === tt}
                  className={cn("rounded-full px-4 py-1.5 capitalize transition-colors", type === tt ? "bg-[var(--glass-bg-strong)] text-[var(--text-strong)]" : "text-[var(--text-muted)]")}>{tt}</button>
              ))}
            </div>

            <label className="text-muted mb-1 block text-xs font-medium">Amount</label>
            <div className="flex items-baseline gap-2">
              <span className="text-muted text-2xl font-light">{prefs.currency}</span>
              <input
                autoFocus
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(formatAmountTyping(e.target.value, loc).display)}
                onKeyDown={(e) => { if (e.key === "Enter") void save(); }}
                placeholder="0"
                className="w-full bg-transparent text-4xl font-light tabular-nums text-[var(--text-strong)] placeholder:text-[var(--text-muted)] focus:outline-none"
              />
            </div>

            <div className="-mx-1 mt-5 flex gap-2 overflow-x-auto px-1 pb-1">
              {cats.map((c) => {
                const Icon = c.icon;
                const active = category === c.id;
                return (
                  <button key={c.id} type="button" onClick={() => setCategory(c.id)} aria-pressed={active}
                    className={cn("flex shrink-0 flex-col items-center gap-1 rounded-2xl border px-3 py-2 text-xs transition-colors",
                      active ? "border-[var(--focus-ring)] bg-[var(--glass-bg-strong)] text-[var(--text-strong)]" : "border-[var(--field-border)] bg-[var(--field-bg)] text-[var(--text-muted)]")}>
                    <Icon className={cn("size-5", active && "text-[var(--color-gold-500)]")} />
                    {c.label.split(" ")[0]}
                  </button>
                );
              })}
            </div>

            <AnimatedButton size="lg" fullWidth className="mt-5" loading={saving} disabled={!uid || !parseAmount(amount)} onClick={save}>
              <Check className="size-4" />Save
            </AnimatedButton>
          </GlassCard>
          <p className="text-muted mt-4 text-center text-xs">
            <Link href="/dashboard" className="hover:text-[var(--text-strong)]">Open Renew</Link>
          </p>
        </div>
      )}
    </main>
  );
}
