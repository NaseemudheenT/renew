"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useCategories } from "@/hooks/useCategories";
import { useLocale } from "@/components/providers/LocaleProvider";

export interface RingRow { category: string; amount: number }

/** Premium, dimensional palette for the ring segments (champagne-led). */
const PALETTE = ["#d4af6e", "#4a7bff", "#37e6ff", "#c05cff", "#ff9d6c", "#43c59e", "#ff6ec7", "#8892a6"];

/**
 * A luminous spending ring — the "wow" visual for analysis. A donut of real
 * category spend for the period, drawn as animated arcs with a glowing core that
 * shows the total. Pure SVG, honest data only. Sits beside the category bars.
 */
export function SpendingRing({ rows, currency }: { rows: RingRow[]; currency: string }) {
  const { resolve } = useCategories();
  const { money } = useLocale();
  const reduced = useReducedMotion();

  const total = rows.reduce((s, r) => s + r.amount, 0);
  const R = 52;
  const C = 2 * Math.PI * R;

  // Cumulative arcs; cap at 8 slices (7 + "other") so the ring stays legible.
  const segments = useMemo(() => {
    const top = rows.slice(0, 7);
    const restAmt = rows.slice(7).reduce((s, r) => s + r.amount, 0);
    const list = restAmt > 0 ? [...top, { category: "__other", amount: restAmt }] : top;
    const fracs = list.map((r) => (total > 0 ? r.amount / total : 0));
    return list.map((r, i) => {
      const frac = fracs[i]!;
      const prior = fracs.slice(0, i).reduce((s, f) => s + f, 0);
      return { ...r, color: PALETTE[i % PALETTE.length]!, dash: frac * C, offset: -prior * C, pct: Math.round(frac * 100) };
    });
  }, [rows, total, C]);

  if (total <= 0) return null;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative grid size-40 shrink-0 place-items-center">
        <div aria-hidden className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(212,175,110,0.20),transparent_68%)] blur-xl" />
        <svg viewBox="0 0 128 128" className="size-40 -rotate-90">
          <circle cx="64" cy="64" r={R} fill="none" stroke="var(--field-bg)" strokeWidth="14" />
          {segments.map((s) => (
            <motion.circle
              key={s.category} cx="64" cy="64" r={R} fill="none" stroke={s.color} strokeWidth="14" strokeLinecap="round"
              strokeDasharray={`${s.dash} ${C - s.dash}`} strokeDashoffset={s.offset}
              initial={reduced ? false : { strokeDasharray: `0 ${C}` }}
              animate={{ strokeDasharray: `${s.dash} ${C - s.dash}` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              style={{ filter: "drop-shadow(0 0 3px rgba(0,0,0,0.25))" }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-muted text-[10px] uppercase tracking-wide">Spent</p>
            <p className="text-strong max-w-[6.5rem] truncate text-base font-semibold tabular-nums">{money(total, currency)}</p>
          </div>
        </div>
      </div>

      <ul className="grid w-full grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
        {segments.map((s) => {
          const label = s.category === "__other" ? "Other" : resolve(s.category).label;
          return (
            <li key={s.category} className="flex items-center gap-2 text-xs">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
              <span className="text-body min-w-0 flex-1 truncate">{label}</span>
              <span className="text-muted shrink-0 tabular-nums">{s.pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
