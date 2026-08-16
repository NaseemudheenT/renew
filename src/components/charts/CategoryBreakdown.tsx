"use client";

import { motion, useReducedMotion } from "framer-motion";
import { categoryMeta } from "@/lib/categories";
import type { Category } from "@/lib/types";

export interface CategoryDatum {
  category: Category;
  count: number;
}

/** Horizontal bars showing how active obligations split across categories. */
export function CategoryBreakdown({ data }: { data: CategoryDatum[] }) {
  const reduced = useReducedMotion();
  const max = Math.max(1, ...data.map((d) => d.count));
  const sorted = [...data].sort((a, b) => b.count - a.count);

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((d, i) => {
        const meta = categoryMeta(d.category);
        const Icon = meta.icon;
        return (
          <div key={d.category} className="flex items-center gap-3">
            <span className="text-muted flex w-28 shrink-0 items-center gap-1.5 text-xs">
              <Icon className="size-3.5" />
              {meta.label}
            </span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--glass-bg-soft)]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-gold-300 to-gold-500"
                initial={reduced ? false : { width: 0 }}
                animate={{ width: `${(d.count / max) * 100}%` }}
                transition={{ duration: 0.6, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <span className="text-body w-6 text-right text-xs tabular-nums">{d.count}</span>
          </div>
        );
      })}
    </div>
  );
}
