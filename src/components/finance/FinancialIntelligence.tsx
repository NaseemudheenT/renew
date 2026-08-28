"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, AlertTriangle, Scale, Sparkles, LineChart } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { StaggerContainer, StaggerItem } from "@/components/motion";
import { smartInsights } from "@/lib/intelligence";
import { useCategories } from "@/hooks/useCategories";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Phase 2 — Financial Intelligence, in plain language. Turns the deterministic
 * signals from lib/intelligence into a few honest sentences: how this month
 * compares, which categories are unusually high, and the needs-vs-wants split.
 */
export function FinancialIntelligence({
  transactions,
  currency,
  hideTrend = false,
  max,
}: {
  transactions: Transaction[];
  currency: string;
  /** Skip the month trend (e.g. the dashboard already shows it elsewhere). */
  hideTrend?: boolean;
  /** Cap the number of lines shown (compact placements like the dashboard). */
  max?: number;
}) {
  const { money } = useLocale();
  const { resolve } = useCategories();
  const insights = useMemo(() => {
    let list = smartInsights(transactions);
    if (hideTrend) list = list.filter((i) => i.kind !== "trend");
    return typeof max === "number" ? list.slice(0, max) : list;
  }, [transactions, hideTrend, max]);

  if (insights.length === 0) return null;

  return (
    <GlassCard padded>
      <div className="mb-4 flex items-center gap-2.5">
        <Sparkles className="size-5 text-[var(--color-gold-500)]" />
        <h2 className="text-strong text-base font-medium">What your money means</h2>
      </div>

      <StaggerContainer className="flex flex-col gap-2.5" stagger={0.06}>
        {insights.map((i) => {
          if (i.kind === "trend") {
            const up = (i.pct ?? 0) > 0;
            return (
              <StaggerItem key={i.id}>
                <Line
                  icon={up ? TrendingUp : TrendingDown}
                  tone={up ? "rose" : "emerald"}
                  text={
                    <>You&apos;ve spent <strong className="text-strong">{money(i.amount ?? 0, currency)}</strong> this month — <strong className={up ? "text-rose-500" : "text-emerald-500"}>{Math.abs(i.pct ?? 0)}% {up ? "more" : "less"}</strong> than last month.</>
                  }
                />
              </StaggerItem>
            );
          }
          if (i.kind === "anomaly") {
            const label = resolve(i.category ?? "").label;
            return (
              <StaggerItem key={i.id}>
                <Line
                  icon={AlertTriangle}
                  tone="amber"
                  text={
                    <><strong className="text-strong">{label}</strong> is <strong className="text-amber-500">{i.pct}% above</strong> your usual — {money(i.amount ?? 0, currency)} vs about {money(i.amount2 ?? 0, currency)}/mo.</>
                  }
                />
              </StaggerItem>
            );
          }
          if (i.kind === "forecast") {
            return (
              <StaggerItem key={i.id}>
                <Line
                  icon={LineChart}
                  tone="calm"
                  text={<>At this pace, you&apos;re on track to spend about <strong className="text-strong">{money(i.amount ?? 0, currency)}</strong> by month end. <span className="text-muted">(estimate)</span></>}
                />
              </StaggerItem>
            );
          }
          // split (essential vs discretionary)
          const essential = i.amount ?? 0;
          const discretionary = i.amount2 ?? 0;
          const total = essential + discretionary;
          const pct = total > 0 ? Math.round((essential / total) * 100) : 0;
          return (
            <StaggerItem key={i.id}>
              <Line
                icon={Scale}
                tone="calm"
                text={
                  <>This month: <strong className="text-strong">{money(essential, currency)}</strong> on needs, <strong className="text-strong">{money(discretionary, currency)}</strong> on wants.</>
                }
              >
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--glass-bg-soft)]">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500" style={{ width: `${pct}%` }} />
                </div>
              </Line>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </GlassCard>
  );
}

function Line({
  icon: Icon,
  tone,
  text,
  children,
}: {
  icon: typeof TrendingUp;
  tone: "rose" | "emerald" | "amber" | "calm";
  text: React.ReactNode;
  children?: React.ReactNode;
}) {
  const toneCls =
    tone === "rose" ? "text-rose-500 bg-rose-500/10"
    : tone === "emerald" ? "text-emerald-500 bg-emerald-500/10"
    : tone === "amber" ? "text-amber-500 bg-amber-500/10"
    : "text-[var(--color-gold-500)] bg-[var(--glass-bg-soft)]";
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] p-3.5">
      <span className={cn("grid size-8 shrink-0 place-items-center rounded-xl", toneCls)}><Icon className="size-4" /></span>
      <div className="min-w-0 flex-1">
        <p className="text-body text-sm leading-relaxed">{text}</p>
        {children}
      </div>
    </div>
  );
}
