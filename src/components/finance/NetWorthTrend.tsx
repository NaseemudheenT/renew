"use client";

import { useMemo, useId, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { Transaction } from "@/lib/types";

const MONTHS = 6;
const ymIndex = (ts: number) => { const d = new Date(ts); return d.getFullYear() * 12 + d.getMonth(); };

/**
 * A calm net-worth sparkline for the last 6 months, anchored so the final point
 * equals today's net worth and each earlier point removes that month's net cash
 * flow (income − expense). Honest trend from real transactions — savings treated
 * as roughly constant across the short window, and it's labelled as a trend.
 * Works the same on phone and desktop.
 */
export function NetWorthTrend({ transactions, netWorth }: { transactions: Transaction[]; netWorth: number }) {
  const reduced = useReducedMotion();
  const gid = useId();
  // Computed once on mount (lazy init keeps the memo pure).
  const [nowIdx] = useState(() => ymIndex(Date.now()));

  const points = useMemo(() => {
    // Net flow per month for the last MONTHS months (oldest → newest).
    const deltas = Array.from({ length: MONTHS }, (_, k) => nowIdx - (MONTHS - 1) + k).map((idx) => {
      let flow = 0;
      for (const t of transactions) {
        if (ymIndex(t.date) === idx) flow += t.type === "income" ? t.amount : -t.amount;
      }
      return flow;
    });
    const total = deltas.reduce((s, d) => s + d, 0);
    let running = netWorth - total;
    return deltas.map((d) => (running += d));
  }, [transactions, netWorth, nowIdx]);

  // Need at least two distinct points to draw a meaningful line.
  const distinct = new Set(points.map((p) => Math.round(p))).size;
  if (points.length < 2 || distinct < 2) return null;

  const W = 100, H = 30, PAD = 3;
  const min = Math.min(...points), max = Math.max(...points);
  const span = max - min || 1;
  const xy = points.map((p, i) => {
    const x = PAD + (i / (points.length - 1)) * (W - PAD * 2);
    const y = PAD + (1 - (p - min) / span) * (H - PAD * 2);
    return [x, y] as const;
  });
  const line = xy.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${xy[xy.length - 1]![0].toFixed(1)} ${H} L${xy[0]![0].toFixed(1)} ${H} Z`;

  const up = points[points.length - 1]! >= points[0]!;
  const stroke = up ? "#43c59e" : "#f4708c";
  const changePct = points[0] !== 0 ? Math.round(((points[points.length - 1]! - points[0]!) / Math.abs(points[0]!)) * 100) : null;

  return (
    <div className="mt-4 flex items-center gap-3">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-9 flex-1" aria-hidden>
        <defs>
          <linearGradient id={`nwt-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={stroke} stopOpacity="0.28" />
            <stop offset="1" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#nwt-${gid})`} />
        <motion.path d={line} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
          initial={reduced ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
        <circle cx={xy[xy.length - 1]![0]} cy={xy[xy.length - 1]![1]} r="2" fill={stroke} />
      </svg>
      <span className="text-muted inline-flex shrink-0 items-center gap-1 text-xs font-medium" style={{ color: stroke }}>
        {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
        {changePct !== null ? `${changePct > 0 ? "+" : ""}${changePct}%` : "6-mo"}
      </span>
    </div>
  );
}
