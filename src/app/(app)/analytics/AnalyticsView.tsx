"use client";

import { useMemo, useState } from "react";
import { orderBy } from "firebase/firestore";
import { FinancialIntelligence } from "@/components/finance/FinancialIntelligence";
import { subMonths } from "date-fns";
import { motion, useReducedMotion } from "framer-motion";
import { BarChart3, ArrowDownLeft, ArrowUpRight, PiggyBank, ChevronLeft, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { StaggerContainer, StaggerItem } from "@/components/motion";
import { useScopedUserCollection } from "@/hooks/useScopedUserCollection";
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
  const monthYearFmt = useMemo(() => new Intl.DateTimeFormat(loc, { month: "long", year: "numeric" }), [loc]);
  const txC = useMemo(() => [orderBy("date", "desc")], []);
  const { data, loading } = useScopedUserCollection<Transaction>("transactions", txC);
  const subs = useScopedUserCollection<Subscription>("subscriptions");
  const reduced = useReducedMotion();
  const currency = data[0]?.currency ?? prefs.currency;

  // Which month is being viewed — 0 = this month, higher = further back. Renew
  // is month-wise on purpose: you always know exactly which month you're seeing.
  const [offset, setOffset] = useState(0);
  const ref = useMemo(() => subMonths(new Date(), offset), [offset]);

  // Trailing six months ENDING at the viewed month, so the chart frames it.
  const months = useMemo(() => {
    const out: { label: string; income: number; expense: number; off: number }[] = [];
    for (let i = MONTHS - 1; i >= 0; i--) {
      const d = subMonths(ref, i);
      const { start, end } = monthRange(d);
      let income = 0, expense = 0;
      for (const t of data) if (t.date >= start && t.date < end) { if (t.type === "income") income += t.amount; else expense += t.amount; }
      out.push({ label: monthFmt.format(d), income, expense, off: offset + i });
    }
    return out;
  }, [data, monthFmt, ref, offset]);

  const viewMonth = months[months.length - 1] ?? { income: 0, expense: 0 };
  const savingsRate = viewMonth.income > 0 ? Math.round(((viewMonth.income - viewMonth.expense) / viewMonth.income) * 100) : 0;

  const byCategory = useMemo(() => {
    const { start, end } = monthRange(ref);
    const m = new Map<string, number>();
    for (const t of data) if (t.type === "expense" && t.date >= start && t.date < end) m.set(t.category, (m.get(t.category) ?? 0) + t.amount);
    return Array.from(m.entries()).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
  }, [data, ref]);
  const catMax = Math.max(1, ...byCategory.map((c) => c.amount));

  const bySource = useMemo(() => {
    const { start, end } = monthRange(ref);
    const m = new Map<string, number>();
    for (const t of data) if (t.type === "income" && t.date >= start && t.date < end) m.set(t.category, (m.get(t.category) ?? 0) + t.amount);
    return Array.from(m.entries()).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
  }, [data, ref]);
  const srcMax = Math.max(1, ...bySource.map((c) => c.amount));
  const maxMonth = Math.max(1, ...months.map((m) => Math.max(m.income, m.expense)));

  // Whole-year totals for the viewed year.
  const year = ref.getFullYear();
  const yearTotals = useMemo(() => {
    let income = 0, expense = 0;
    for (const t of data) if (new Date(t.date).getFullYear() === year) { if (t.type === "income") income += t.amount; else expense += t.amount; }
    return { income, expense };
  }, [data, year]);

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
      <PageHeader title={t("nav.analytics")} subtitle="A clear, honest picture of your money, month by month." />
      <StaggerContainer className="flex flex-col gap-6" stagger={0.07}>
        {/* Month picker — you always know exactly which month you're looking at. */}
        <StaggerItem>
          <div className="flex items-center justify-between rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-2 py-1.5">
            <button type="button" onClick={() => setOffset((o) => o + 1)} aria-label="Previous month"
              className="grid size-9 place-items-center rounded-full text-[var(--text-body)] transition-colors hover:bg-[var(--glass-bg-soft)]">
              <ChevronLeft className="size-5" />
            </button>
            <span className="text-strong text-sm font-medium">{monthYearFmt.format(ref)}{offset === 0 && <span className="text-muted"> · this month</span>}</span>
            <button type="button" onClick={() => setOffset((o) => Math.max(0, o - 1))} disabled={offset === 0} aria-label="Next month"
              className="grid size-9 place-items-center rounded-full text-[var(--text-body)] transition-colors hover:bg-[var(--glass-bg-soft)] disabled:opacity-30">
              <ChevronRight className="size-5" />
            </button>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="grid grid-cols-3 gap-3">
            <Stat icon={ArrowDownLeft} label="Income · month" amount={viewMonth.income} currency={currency} tone="emerald" />
            <Stat icon={ArrowUpRight} label="Spent · month" amount={viewMonth.expense} currency={currency} tone="rose" />
            <Stat icon={PiggyBank} label="Savings rate" value={`${savingsRate}%`} />
          </div>
        </StaggerItem>

        {/* Whole-year totals for the viewed year. */}
        <StaggerItem>
          <GlassCard padded>
            <div className="flex items-center justify-between">
              <h2 className="text-strong text-sm font-medium">{year} · year so far</h2>
              <span className={cn("text-sm font-medium tabular-nums", yearTotals.income - yearTotals.expense >= 0 ? "text-emerald-500" : "text-rose-500")}>
                {yearTotals.income - yearTotals.expense >= 0 ? "+" : "−"}{money(Math.abs(yearTotals.income - yearTotals.expense), currency)}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.07] p-3">
                <p className="text-muted text-xs">Income</p>
                <AnimatedAmount value={yearTotals.income} currency={currency} className="mt-1 block text-lg font-semibold tabular-nums text-emerald-500" />
              </div>
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.07] p-3">
                <p className="text-muted text-xs">Spent</p>
                <AnimatedAmount value={yearTotals.expense} currency={currency} className="mt-1 block text-lg font-semibold tabular-nums text-rose-500" />
              </div>
            </div>
          </GlassCard>
        </StaggerItem>

        <StaggerItem>
          <FinancialIntelligence transactions={data} currency={currency} />
        </StaggerItem>

        <StaggerItem>
          <GlassCard padded>
            <h2 className="text-strong mb-4 text-sm font-medium">Income vs expense</h2>
            <div className="flex h-44 items-end gap-3">
              {months.map((m, i) => (
                <button type="button" key={i} onClick={() => setOffset(m.off)} title={`View ${m.label}`}
                  className={cn("flex h-full flex-1 flex-col items-center justify-end gap-1 rounded-lg pt-1 transition-colors", m.off === offset ? "bg-[var(--glass-bg-soft)]" : "hover:bg-[var(--glass-bg-soft)]/60")}>
                  <div className="flex h-full w-full items-end justify-center gap-1">
                    <motion.div className="w-1/2 max-w-4 origin-bottom rounded-t-md bg-gradient-to-t from-emerald-500 to-emerald-300" style={{ height: `${(m.income / maxMonth) * 100}%` }} initial={reduced ? false : { scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.5, delay: i * 0.04 }} />
                    <motion.div className="w-1/2 max-w-4 origin-bottom rounded-t-md bg-gradient-to-t from-rose-500 to-rose-300" style={{ height: `${(m.expense / maxMonth) * 100}%` }} initial={reduced ? false : { scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.5, delay: i * 0.04 + 0.05 }} />
                  </div>
                  <span className={cn("text-[10px]", m.off === offset ? "text-strong font-medium" : "text-muted")}>{m.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs">
              <span className="text-muted inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-emerald-400" />Income</span>
              <span className="text-muted inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-rose-400" />Expense</span>
              <span className="text-muted ms-auto">Last {MONTHS} months</span>
            </div>
          </GlassCard>
        </StaggerItem>

        {bySource.length > 0 && (
          <StaggerItem>
            <GlassCard padded>
              <h2 className="text-strong mb-4 text-sm font-medium">Income by source</h2>
              <div className="flex flex-col gap-3">
                {bySource.map((d, i) => {
                  const meta = resolve(d.category);
                  const Icon = meta.icon;
                  return (
                    <div key={d.category} className="flex items-center gap-3">
                      <span className="text-muted flex w-32 shrink-0 items-center gap-1.5 text-xs"><Icon className="size-3.5" />{meta.label}</span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--glass-bg-soft)]">
                        <motion.div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500" initial={reduced ? false : { width: 0 }} animate={{ width: `${(d.amount / srcMax) * 100}%` }} transition={{ duration: 0.6, delay: i * 0.05 }} />
                      </div>
                      <span className="text-body w-20 text-end text-xs tabular-nums">{money(d.amount, currency)}</span>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </StaggerItem>
        )}

        <StaggerItem>
          <GlassCard padded>
            <h2 className="text-strong mb-4 text-sm font-medium">Spending by category</h2>
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
