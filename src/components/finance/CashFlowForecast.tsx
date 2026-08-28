"use client";

import { useMemo } from "react";
import { TrendingUp, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedAmount } from "@/components/finance/AnimatedAmount";
import { cashFlowForecast } from "@/lib/intelligence";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Cash-flow forecast (Constitution §19): where the money is likely to land by
 * month end — current balance + income likely still to arrive − spending likely
 * still to happen and bills still due. Clearly an estimate, from real averages.
 */
export function CashFlowForecast({
  transactions,
  currentBalance,
  upcomingBillsTotal,
  currency,
}: {
  transactions: Transaction[];
  currentBalance: number;
  upcomingBillsTotal: number;
  currency: string;
}) {
  const { money } = useLocale();
  const f = useMemo(
    () => cashFlowForecast({ transactions, currentBalance, upcomingBillsTotal }),
    [transactions, currentBalance, upcomingBillsTotal],
  );

  // Nothing meaningful to project yet.
  if (f.expectedIncome === 0 && f.expectedExpense === 0) return null;

  const tight = f.projectedBalance < 0;

  return (
    <GlassCard padded className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-[radial-gradient(circle,var(--bokeh-3),transparent_70%)] blur-2xl opacity-70" />
      <div className="flex items-center gap-2.5">
        <TrendingUp className="size-5 text-[var(--color-gold-500)]" />
        <h2 className="text-strong text-base font-medium">Month-end forecast</h2>
        <span className="text-muted text-xs">estimate</span>
      </div>

      <p className="text-muted mt-3 text-sm">Likely available by month end</p>
      <AnimatedAmount
        value={f.projectedBalance}
        currency={currency}
        className={cn("mt-1 block text-3xl font-light tabular-nums sm:text-4xl", tight ? "text-rose-500" : "text-[var(--text-strong)]")}
      />

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span className="text-muted">Now <span className="text-body font-medium tabular-nums">{money(f.current, currency)}</span></span>
        <span className="flex items-center gap-1 text-emerald-500"><ArrowDownLeft className="size-3.5" />+{money(f.expectedIncome, currency)} <span className="text-muted font-normal">expected in</span></span>
        <span className="flex items-center gap-1 text-rose-500"><ArrowUpRight className="size-3.5" />−{money(f.expectedExpense, currency)} <span className="text-muted font-normal">expected out</span></span>
      </div>

      {tight && (
        <p className="text-muted mt-3 text-xs">Heads up — at this pace you could dip below zero before month end.</p>
      )}
    </GlassCard>
  );
}
