"use client";

import { useMemo } from "react";
import { ArrowDownLeft, TrendingUp, TrendingDown } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { AnimatedAmount } from "@/components/finance/AnimatedAmount";
import { useScopedUserCollection } from "@/hooks/useScopedUserCollection";
import { useLocale } from "@/components/providers/LocaleProvider";
import { usePrivacy } from "@/components/providers/PrivacyProvider";
import { useCategories } from "@/hooks/useCategories";
import { monthRange } from "@/lib/finance";
import type { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

export function IncomeView() {
  const { money, date } = useLocale();
  const { hidden, mask } = usePrivacy();
  const { resolve } = useCategories();
  const { data, loading } = useScopedUserCollection<Transaction>("transactions");

  const income = useMemo(() => data.filter((t) => t.type === "income").sort((a, b) => b.date - a.date), [data]);
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
      <PageHeader title="Income" subtitle="Where your money comes from — by source, month by month." />

      {loading ? (
        <ListSkeleton />
      ) : isEmpty ? (
        <GlassCard padded>
          <EmptyState icon={ArrowDownLeft} title="No income yet" description="Add an income transaction — salary, freelance, a refund — and it'll show here by source and trend." />
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Summary */}
          <GlassCard padded>
            <p className="text-muted text-sm">This month</p>
            <AnimatedAmount value={thisMonth} currency={currency ?? "USD"} className="text-strong mt-1 block text-4xl font-light tabular-nums sm:text-5xl" />
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
              {pct !== null && (
                <span className={cn("inline-flex items-center gap-1", pct >= 0 ? "text-emerald-500" : "text-rose-500")}>
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
                    <div className="w-full rounded-md bg-gradient-to-t from-emerald-500/70 to-emerald-400/40" style={{ height: `${Math.max(3, (b.amount / trendMax) * 100)}%` }} title={hidden ? "" : money(b.amount, currency)} />
                  </div>
                  <span className="text-muted text-[0.65rem]">{b.label}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* By source */}
          <GlassCard padded>
            <h2 className="text-strong text-sm font-medium">By source · this month</h2>
            {bySource.rows.length === 0 ? (
              <EmptyState compact icon={ArrowDownLeft} title="No income this month yet" />
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {bySource.rows.map((row) => {
                  const meta = resolve(row.category);
                  const p = bySource.sum > 0 ? Math.round((row.amount / bySource.sum) * 100) : 0;
                  const Icon = meta.icon;
                  return (
                    <li key={row.category} className="flex items-center gap-3">
                      <Icon className="size-4 shrink-0 text-emerald-400" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-body truncate">{meta.label}</span>
                          <span className="text-strong font-medium tabular-nums">{hidden ? mask : money(row.amount, currency)}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--field-bg)]">
                          <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500" style={{ width: `${p}%` }} />
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
    </div>
  );
}
