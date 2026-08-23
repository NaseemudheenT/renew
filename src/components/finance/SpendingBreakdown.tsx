"use client";

import { useMemo } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PieChart } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { usePrivacy } from "@/components/providers/PrivacyProvider";
import { useCategories } from "@/hooks/useCategories";
import { monthRange } from "@/lib/finance";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

const PALETTE = ["#5a86f5", "#f6c453", "#2dd4bf", "#f87171", "#a78bfa", "#fb923c", "#34d399", "#f472b6"];

/**
 * "Where your money went this month" — an honest breakdown of real spending by
 * category (this calendar month), as a donut + ranked list. Privacy-first:
 * percentages always show (they reveal nothing), amounts stay masked until the
 * person reveals them. Only real, recorded expenses — nothing invented.
 */
export function SpendingBreakdown({ transactions, currency }: { transactions: Transaction[]; currency: string }) {
  const { money, date } = useLocale();
  const { hidden, mask } = usePrivacy();
  const { resolve } = useCategories();

  const { rows, total } = useMemo(() => {
    const { start, end } = monthRange();
    const m = new Map<string, number>();
    for (const t of transactions) {
      if (t.type === "expense" && t.date >= start && t.date < end) m.set(t.category, (m.get(t.category) ?? 0) + t.amount);
    }
    const all = Array.from(m.entries()).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
    const sum = all.reduce((s, r) => s + r.amount, 0);
    return { rows: all, total: sum };
  }, [transactions]);

  const monthName = date(new Date(), { month: "long" });

  if (total === 0) {
    return (
      <GlassCard padded>
        <h2 className="text-strong text-sm font-medium">Where your money went · {monthName}</h2>
        <EmptyState compact icon={PieChart} title="No spending yet this month" />
      </GlassCard>
    );
  }

  // Donut geometry.
  const r = 42;
  const C = 2 * Math.PI * r;
  const shown = rows.slice(0, PALETTE.length);
  const segments = shown.map((row, i, arr) => {
    const off = arr.slice(0, i).reduce((s, x) => s + (x.amount / total) * C, 0);
    return { color: PALETTE[i % PALETTE.length]!, len: (row.amount / total) * C, off };
  });

  const top = rows.slice(0, 6);

  return (
    <GlassCard padded>
      <div className="flex items-center justify-between">
        <h2 className="text-strong text-sm font-medium">Where your money went · {monthName}</h2>
      </div>
      <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
        <div className="relative shrink-0">
          <svg width={132} height={132} viewBox="0 0 132 132" className="-rotate-90">
            <circle cx={66} cy={66} r={r} fill="none" stroke="var(--field-bg)" strokeWidth={14} />
            {segments.map((s, i) => (
              <circle
                key={i}
                cx={66}
                cy={66}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={14}
                strokeDasharray={`${Math.max(0, s.len - 1.5)} ${C - Math.max(0, s.len - 1.5)}`}
                strokeDashoffset={-s.off}
                strokeLinecap="round"
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-muted text-[0.65rem]">Spent</span>
            <span className="text-strong text-sm font-semibold tabular-nums">{hidden ? mask : money(total, currency)}</span>
          </div>
        </div>

        <ul className="flex w-full min-w-0 flex-1 flex-col gap-1">
          {top.map((row, i) => {
            const meta = resolve(row.category);
            const pct = Math.round((row.amount / total) * 100);
            return (
              <li key={row.category} className="flex items-center gap-3 py-1">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                <span className="text-body min-w-0 flex-1 truncate text-sm">{meta.label}</span>
                <span className="text-muted shrink-0 text-xs tabular-nums">{pct}%</span>
                <span className={cn("text-strong w-20 shrink-0 text-end text-sm font-medium tabular-nums")}>{hidden ? mask : money(row.amount, currency)}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </GlassCard>
  );
}
