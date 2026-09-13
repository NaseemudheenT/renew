"use client";

import { motion } from "framer-motion";
import { useCategories } from "@/hooks/useCategories";
import { useLocale } from "@/components/providers/LocaleProvider";

export interface RenChartData {
  title: string;
  currency: string;
  rows: { category: string; amount: number }[];
}

/**
 * A little live chart Ren draws inside the conversation — real category totals,
 * as clean animated bars. This is Ren *showing* an answer, not just saying it.
 * Purely from the user's own data; no invented numbers.
 */
export function RenChart({ data }: { data: RenChartData }) {
  const { resolve } = useCategories();
  const { money } = useLocale();
  const max = Math.max(1, ...data.rows.map((r) => r.amount));

  return (
    <div className="w-full rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg-soft)] p-3.5">
      <p className="text-strong mb-3 text-xs font-medium">{data.title}</p>
      <div className="flex flex-col gap-2.5">
        {data.rows.map((r, i) => {
          const meta = resolve(r.category);
          const Icon = meta.icon;
          return (
            <div key={r.category} className="flex items-center gap-2.5">
              <span className="text-muted flex w-24 shrink-0 items-center gap-1.5 text-xs">
                <Icon className="size-3.5 shrink-0" />
                <span className="truncate">{meta.label}</span>
              </span>
              <span className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--field-bg)]">
                <motion.span
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[var(--color-gold-300)] to-[var(--color-gold-500)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${(r.amount / max) * 100}%` }}
                  transition={{ duration: 0.6, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                />
              </span>
              <span className="text-body w-16 shrink-0 text-end text-xs tabular-nums">{money(r.amount, data.currency)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
