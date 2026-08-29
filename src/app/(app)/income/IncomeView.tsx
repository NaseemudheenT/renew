"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, TrendingUp, TrendingDown, Plus, Mic, ScanLine, ImageUp, Upload, Pencil } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { AnimatedButton, AnimatedModal } from "@/components/motion";
import { AnimatedAmount } from "@/components/finance/AnimatedAmount";
import { AddMenu } from "@/components/finance/AddMenu";
import { VoiceAdd } from "@/components/finance/VoiceAdd";
import { TransactionForm } from "@/components/finance/TransactionForm";
import { toast } from "@/components/ui/toast-store";
import { useScopedUserCollection } from "@/hooks/useScopedUserCollection";
import { useLocale } from "@/components/providers/LocaleProvider";
import { usePrivacy } from "@/components/providers/PrivacyProvider";
import { useCategories } from "@/hooks/useCategories";
import { createTransaction, type TransactionInput } from "@/lib/firestore/transactions";
import { monthRange } from "@/lib/finance";
import type { Transaction, TxType } from "@/lib/types";
import { cn } from "@/lib/utils";

/** One flow (income or expenses) — summary, by-category breakdown, 6-month trend,
 *  and its own "+" add-flow. Rendered under the Income/Expense tabs. */
export function FlowView({ flow }: { flow: TxType }) {
  const isIncome = flow === "income";
  const router = useRouter();
  const { money, date, prefs } = useLocale();
  const { hidden, mask } = usePrivacy();
  const { resolve } = useCategories();
  const { data, loading, uid } = useScopedUserCollection<Transaction>("transactions");
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(input: TransactionInput) {
    if (!uid) return;
    setSubmitting(true);
    try {
      await createTransaction(uid, input);
      toast({ title: isIncome ? "Income added" : "Expense added", variant: "success" });
      setModalOpen(false);
      setVoiceOpen(false);
    } catch {
      toast({ title: "Something went wrong", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  const income = useMemo(() => data.filter((t) => t.type === flow).sort((a, b) => b.date - a.date), [data, flow]);
  const currency = income[0]?.currency ?? data[0]?.currency;

  const { thisMonth, lastMonth, total } = useMemo(() => {
    const { start, end } = monthRange();
    const prevStart = new Date(new Date(start).getFullYear(), new Date(start).getMonth() - 1, 1).getTime();
    let tm = 0, lm = 0, tot = 0;
    for (const t of income) {
      tot += t.amount;
      if (t.date >= start && t.date < end) tm += t.amount;
      else if (t.date >= prevStart && t.date < start) lm += t.amount;
    }
    return { thisMonth: tm, lastMonth: lm, total: tot };
  }, [income]);

  const pct = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null;

  const bySource = useMemo(() => {
    const { start, end } = monthRange();
    const m = new Map<string, number>();
    for (const t of income) if (t.date >= start && t.date < end) m.set(t.category, (m.get(t.category) ?? 0) + t.amount);
    const rows = Array.from(m.entries()).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
    const sum = rows.reduce((s, r) => s + r.amount, 0);
    return { rows, sum };
  }, [income]);

  // Last 6 calendar months of income for a simple trend.
  const trend = useMemo(() => {
    const now = new Date();
    const buckets: { label: string; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = d.getTime();
      const endD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1).getTime();
      let amt = 0;
      for (const t of income) if (t.date >= start && t.date < endD) amt += t.amount;
      buckets.push({ label: date(d, { month: "short" }), amount: amt });
    }
    return buckets;
  }, [income, date]);
  const trendMax = Math.max(1, ...trend.map((b) => b.amount));

  const isEmpty = !loading && income.length === 0;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={isIncome ? "Income" : "Expenses"} subtitle={isIncome ? "Where your money comes from — by source, month by month." : "Where your money goes — by category, month by month."} action={<AnimatedButton onClick={() => setAddMenuOpen(true)}><Plus className="size-4" />Add</AnimatedButton>} />

      {loading ? (
        <ListSkeleton />
      ) : isEmpty ? (
        <GlassCard padded>
          <EmptyState icon={isIncome ? ArrowDownLeft : ArrowUpRight} title={isIncome ? "No income yet" : "No expenses yet"} description={isIncome ? "Add income — salary, freelance, a refund — and it'll show here by source and trend." : "Add an expense and it'll show here by category and trend."} />
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Summary */}
          <GlassCard padded>
            <p className="text-muted text-sm">This month</p>
            <AnimatedAmount value={thisMonth} currency={currency ?? "USD"} className="text-strong mt-1 block text-4xl font-light tabular-nums sm:text-5xl" />
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
              {pct !== null && (
                <span className={cn("inline-flex items-center gap-1", (pct >= 0) === isIncome ? "text-emerald-500" : "text-rose-500")}>
                  {pct >= 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}{Math.abs(pct)}% vs last month
                </span>
              )}
              <span className="text-muted">Total tracked: {hidden ? mask : money(total, currency)}</span>
            </div>
          </GlassCard>

          {/* Trend */}
          <GlassCard padded>
            <h2 className="text-strong text-sm font-medium">Last 6 months</h2>
            <div className="mt-4 flex items-end justify-between gap-2" style={{ height: 120 }}>
              {trend.map((b, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex w-full flex-1 items-end">
                    <div className={cn("w-full rounded-md bg-gradient-to-t", isIncome ? "from-emerald-500/70 to-emerald-400/40" : "from-rose-500/70 to-rose-400/40")} style={{ height: `${Math.max(3, (b.amount / trendMax) * 100)}%` }} title={hidden ? "" : money(b.amount, currency)} />
                  </div>
                  <span className="text-muted text-[0.65rem]">{b.label}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* By source */}
          <GlassCard padded>
            <h2 className="text-strong text-sm font-medium">{isIncome ? "By source · this month" : "By category · this month"}</h2>
            {bySource.rows.length === 0 ? (
              <EmptyState compact icon={isIncome ? ArrowDownLeft : ArrowUpRight} title={isIncome ? "No income this month yet" : "No expenses this month yet"} />
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {bySource.rows.map((row) => {
                  const meta = resolve(row.category);
                  const p = bySource.sum > 0 ? Math.round((row.amount / bySource.sum) * 100) : 0;
                  const Icon = meta.icon;
                  return (
                    <li key={row.category} className="flex items-center gap-3">
                      <Icon className={cn("size-4 shrink-0", isIncome ? "text-emerald-400" : "text-rose-400")} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-body truncate">{meta.label}</span>
                          <span className="text-strong font-medium tabular-nums">{hidden ? mask : money(row.amount, currency)}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--field-bg)]">
                          <div className={cn("h-full rounded-full bg-gradient-to-r", isIncome ? "from-emerald-400 to-emerald-500" : "from-rose-400 to-rose-500")} style={{ width: `${p}%` }} />
                        </div>
                      </div>
                      <span className="text-muted w-9 shrink-0 text-end text-xs tabular-nums">{p}%</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </GlassCard>

          {/* Recent income */}
          <GlassCard padded>
            <h2 className="text-strong text-sm font-medium">Recent income</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {income.slice(0, 8).map((t) => {
                const meta = resolve(t.category);
                return (
                  <li key={t.id} className="flex items-center gap-3 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-2.5">
                    <span className="text-body min-w-0 flex-1 truncate text-sm">{t.note || meta.label}</span>
                    <span className="text-muted text-xs">{date(new Date(t.date), { day: "numeric", month: "short" })}</span>
                    <span className="text-sm font-medium tabular-nums text-emerald-500">+{hidden ? mask : money(t.amount, t.currency)}</span>
                  </li>
                );
              })}
            </ul>
          </GlassCard>
        </div>
      )}

      <AddMenu
        open={addMenuOpen}
        onClose={() => setAddMenuOpen(false)}
        title={isIncome ? "Add income" : "Add expense"}
        options={[
          { icon: Pencil, title: "Enter manually", sub: isIncome ? "Amount + source, in seconds" : "Amount + category, in seconds", onClick: () => setModalOpen(true) },
          { icon: Mic, title: "Speak it", sub: isIncome ? "Say the amount and where it's from" : "Say the amount and what it was", onClick: () => setVoiceOpen(true) },
          { icon: ScanLine, title: "Scan a document", sub: isIncome ? "Camera reads amount, date & source" : "Camera reads amount, date & merchant", onClick: () => router.push("/import?scan=1") },
          { icon: ImageUp, title: "Photo or PDF", sub: isIncome ? "Upload a payslip or statement" : "Upload a receipt or statement", onClick: () => router.push("/import") },
          { icon: Upload, title: "Import CSV / bank statement", sub: "Bring in many at once", onClick: () => router.push("/import") },
        ]}
      />

      <VoiceAdd open={voiceOpen} onClose={() => setVoiceOpen(false)} currency={prefs.currency} submitting={submitting} onSubmit={onSubmit} />

      <AnimatedModal open={modalOpen} onClose={() => setModalOpen(false)} title={isIncome ? "Add income" : "Add expense"}>
        <TransactionForm defaultType={flow} defaultCurrency={prefs.currency} submitting={submitting} onSubmit={onSubmit} onCancel={() => setModalOpen(false)} />
      </AnimatedModal>
    </div>
  );
}

/** Income & Expenses on one page, switched by a segmented tab (same pattern as
 *  Analysis/Calendar and Bills/Subscriptions). Each tab is a full FlowView. */
export function MoneyView() {
  const [tab, setTab] = useState<TxType>("income");
  const TABS = [
    { id: "income" as TxType, label: "Income", icon: ArrowDownLeft },
    { id: "expense" as TxType, label: "Expenses", icon: ArrowUpRight },
  ];
  return (
    <div>
      <div className="mb-5 flex justify-center lg:justify-start">
        <div className="glass inline-flex !rounded-full p-1 text-sm">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button key={id} type="button" onClick={() => setTab(id)} aria-pressed={active}
                className={cn("flex items-center gap-2 rounded-full px-4 py-2 font-medium transition-colors", active ? "bg-[var(--glass-bg-strong)] text-[var(--text-strong)]" : "text-[var(--text-muted)] hover:text-[var(--text-strong)]")}>
                <Icon className={cn("size-4", active && "text-[var(--color-gold-500)]")} />{label}
              </button>
            );
          })}
        </div>
      </div>
      <FlowView flow={tab} />
    </div>
  );
}
