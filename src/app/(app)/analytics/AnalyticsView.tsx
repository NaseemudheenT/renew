"use client";

import { useMemo } from "react";
import { orderBy } from "firebase/firestore";
import { subMonths } from "date-fns";
import { motion, useReducedMotion } from "framer-motion";
import { BarChart3, ArrowDownLeft, ArrowUpRight, PiggyBank } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { StaggerContainer, StaggerItem } from "@/components/motion";
import { useUserCollection } from "@/hooks/useUserCollection";
import { AnimatedAmount } from "@/components/finance/AnimatedAmount";
import { subscriptionTotals } from "@/lib/accounts";
import { monthRange } from "@/lib/finance";
import { useCategories } from "@/hooks/useCategories";
import { useLocale } from "@/components/providers/LocaleProvider";
import { cn } from "@/lib/utils";
import type { Transaction, Subscription } from "@/lib/types";

const MONTHS = 6;

export function AnalyticsView() {
  const { prefs, money, t } = useLocale();
  const { resolve } = useCategories();
  const loc = `${prefs.language}-${prefs.region}`;
  const monthFmt = useMemo(() => new Intl.DateTimeFormat(loc, { month: "short" }), [loc]);
  const txC = useMemo(() => [orderBy("date", "desc")], []);
  const { data, loading } = useUserCollection<Transaction>("transactions", txC);
  const subs = useUserCollection<Subscription>("subscriptions");
  const reduced = useReducedMotion();
  const currency = data[0]?.currency ?? prefs.currency;

  const months = useMemo(() => {
    const out: { label: string; income: number; expense: number }[] = [];
    for (let i = MONTHS - 1; i >= 0; i--) {
      const ref = subMonths(new Date(), i);
      const { start, end } = monthRange(ref);
      let income = 0, expense = 0;
      for (const t of data) if (t.date >= start && t.date < end) { if (t.type === "income") income += t.amount; else expense += t.amount; }
      out.push({ label: monthFmt.format(ref), income, expense });
    }
    return out;
  }, [data, monthFmt]);

  const thisMonth = months[months.length - 1] ?? { income: 0, expense: 0 };
  const savingsRate = thisMonth.income > 0 ? Math.round(((thisMonth.income - thisMonth.expense) / thisMonth.income) * 100) : 0;

  const byCategory = useMemo(() => {
    const { start, end } = monthRange();
    const m = new Map<string, number>();
    for (const t of data) if (t.type === "expense" && t.date >= start && t.date < end) m.set(t.category, (m.get(t.category) ?? 0) + t.amount);
    return Array.from(m.entries()).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
  }, [data]);
  const catMax = Math.max(1, ...byCategory.map((c) => c.amount));
  const maxMonth = Math.max(1, ...months.map((m) => Math.max(m.income, m.expense)));

  if (!loading && data.length === 0) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title={t("nav.analytics")} />
        <GlassCard padded><EmptyState icon={BarChart3} title="Nothing to chart yet" description="Add income and expenses and Renew builds a clear picture of your money — always from your real data." /></GlassCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={t("nav.analytics")} subtitle="A clear, honest picture of your money." />
      <StaggerContainer className="flex flex-col gap-6" stagger={0.07}>
        <StaggerItem>
          <div className="grid grid-cols-3 gap-3">
            <Stat icon={ArrowDownLeft} label="Income · month" amount={thisMonth.income} currency={currency} tone="emerald" />
            <Stat icon={ArrowUpRight} label="Spent · month" amount={thisMonth.expense} currency={currency} tone="rose" />
            <Stat icon={PiggyBank} label="Savings rate" value={`${savingsRate}%`} />
          </div>
        </StaggerItem>

        <StaggerItem>
          <GlassCard padded>
            <h2 className="text-strong mb-4 text-sm font-medium">Income vs expense</h2>
            <div className="flex h-44 items-end gap-3">
              {months.map((m, i) => (
                <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <div className="flex h-full w-full items-end justify-center gap-1">
                    <motion.div className="w-1/2 max-w-4 origin-bottom rounded-t-md bg-gradient-to-t from-emerald-500 to-emerald-300" style={{ height: `${(m.income / maxMonth) * 100}%` }} initial={reduced ? false : { scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.5, delay: i * 0.04 }} title={`Income: ${money(m.income, currency)}`} />
                    <motion.div className="w-1/2 max-w-4 origin-bottom rounded-t-md bg-gradient-to-t from-rose-500 to-rose-300" style={{ height: `${(m.expense / maxMonth) * 100}%` }} initial={reduced ? false : { scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.5, delay: i * 0.04 + 0.05 }} title={`Expense: ${money(m.expense, currency)}`} />
                  </div>
                  <span className="text-muted text-[10px]">{m.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs">
              <span className="text-muted inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-emerald-400" />Income</span>
              <span className="text-muted inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-rose-400" />Expense</span>
              <span className="text-muted ms-auto">Last {MONTHS} months</span>
            </div>
          </GlassCard>
        </StaggerItem>

        <StaggerItem>
          <GlassCard padded>
            <h2 className="text-strong mb-4 text-sm font-medium">Spending by category · this month</h2>
            {byCategory.length === 0 ? (
              <EmptyState compact icon={BarChart3} title="No spending yet this month" />
            ) : (
              <div className="flex flex-col gap-3">
                {byCategory.map((d, i) => {
                  const meta = resolve(d.category);
                  const Icon = meta.icon;
                  return (
                    <div key={d.category} className="flex items-center gap-3">
                      <span className="text-muted flex w-32 shrink-0 items-center gap-1.5 text-xs"><Icon className="size-3.5" />{meta.label}</span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--glass-bg-soft)]">
                        <motion.div className="h-full rounded-full bg-gradient-to-r from-gold-300 to-gold-500" initial={reduced ? false : { width: 0 }} animate={{ width: `${(d.amount / catMax) * 100}%` }} transition={{ duration: 0.6, delay: i * 0.05 }} />
                      </div>
                      <span className="text-body w-20 text-end text-xs tabular-nums">{money(d.amount, currency)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </StaggerItem>

        {(() => {
          const st = subscriptionTotals(subs.data, currency);
          if (st.monthly <= 0) return null;
          return (
            <StaggerItem>
              <GlassCard padded>
                <h2 className="text-strong mb-3 text-sm font-medium">Recurring subscriptions</h2>
                <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
                  <div><p className="text-muted text-xs">{t("subs.monthly")}</p><p className="text-strong text-xl font-medium tabular-nums">{money(st.monthly, currency)}</p></div>
                  <div><p className="text-muted text-xs">{t("subs.annual")}</p><p className="text-body text-lg font-medium tabular-nums">{money(st.annual, currency)}</p></div>
                </div>
              </GlassCard>
            </StaggerItem>
          );
        })()}
      </StaggerContainer>
    </div>
  );
}

function Stat({ icon: Icon, label, value, amount, currency, tone }: { icon: typeof BarChart3; label: string; value?: string; amount?: number; currency?: string; tone?: "emerald" | "rose" }) {
  return (
    <GlassCard className="flex flex-col gap-1 p-4">
      <Icon className={cn("size-5", tone === "emerald" ? "text-emerald-400" : tone === "rose" ? "text-rose-400" : "text-[var(--color-gold-500)]")} />
      <div className="text-strong mt-1 text-xl font-medium tabular-nums">
        {amount !== undefined && currency ? <AnimatedAmount value={amount} currency={currency} /> : value}
      </div>
      <div className="text-muted text-xs">{label}</div>
    </GlassCard>
  );
}
