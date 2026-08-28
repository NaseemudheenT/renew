import type { Transaction } from "@/lib/types";

/**
 * RENEW — Phase 2 Financial Intelligence (understand the person).
 * Deterministic, unit-tested analysis over real transactions: monthly category
 * averages, this-month vs last vs average comparisons, essential vs discretionary,
 * and anomaly detection. NO LLM is used for any arithmetic (Constitution §14/§18);
 * the UI just formats these numbers into plain language.
 */

/** Month index (year*12 + month) — lets us compare/relate calendar months. */
function ymIndex(ts: number): number {
  const d = new Date(ts);
  return d.getFullYear() * 12 + d.getMonth();
}

/** Categories that are typically essential (needs) vs discretionary (wants). */
const ESSENTIAL = new Set([
  "food", "groceries", "transport", "fuel", "rent", "bills", "phone",
  "health", "education", "insurance", "kids", "taxes", "fees", "utilities",
]);

export function isEssential(category: string): boolean {
  return ESSENTIAL.has(category);
}

/** Average monthly spend per expense category over the `months` complete months
 *  before the current one (excludes the current, still-in-progress month). */
export function categoryAverages(txns: Transaction[], months: number, now: number = Date.now()): Map<string, number> {
  const curIdx = ymIndex(now);
  const startIdx = curIdx - months;
  const totals = new Map<string, number>();
  for (const t of txns) {
    if (t.type !== "expense") continue;
    const idx = ymIndex(t.date);
    if (idx >= startIdx && idx < curIdx) {
      totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
    }
  }
  const avg = new Map<string, number>();
  for (const [c, total] of totals) avg.set(c, total / months);
  return avg;
}

/** Sum of this-month expenses per category. */
function currentMonthByCategory(txns: Transaction[], now: number): Map<string, number> {
  const curIdx = ymIndex(now);
  const cur = new Map<string, number>();
  for (const t of txns) {
    if (t.type === "expense" && ymIndex(t.date) === curIdx) {
      cur.set(t.category, (cur.get(t.category) ?? 0) + t.amount);
    }
  }
  return cur;
}

export interface Anomaly {
  category: string;
  current: number;
  average: number;
  /** Percent above the historical average (positive = spending more). */
  pct: number;
}

/** Categories whose current-month spend is meaningfully above their own average. */
export function anomalies(
  txns: Transaction[],
  now: number = Date.now(),
  opts: { months?: number; minPct?: number; minAmount?: number } = {},
): Anomaly[] {
  const months = opts.months ?? 3;
  const minPct = opts.minPct ?? 20;
  const minAmount = opts.minAmount ?? 0;
  const avg = categoryAverages(txns, months, now);
  const cur = currentMonthByCategory(txns, now);
  const out: Anomaly[] = [];
  for (const [category, current] of cur) {
    const average = avg.get(category) ?? 0;
    if (average <= 0) continue; // no history to compare against
    const pct = Math.round(((current - average) / average) * 100);
    if (pct >= minPct && current >= minAmount) out.push({ category, current, average, pct });
  }
  return out.sort((a, b) => b.pct - a.pct);
}

export interface MonthCompare {
  thisMonth: number;
  lastMonth: number;
  average: number;
  /** vs last month; null when there's no last-month spend to compare. */
  vsLastPct: number | null;
  /** vs the trailing average; null when there's no history. */
  vsAvgPct: number | null;
}

/** Total expense this month vs last month vs the trailing average. */
export function monthComparison(txns: Transaction[], now: number = Date.now(), avgMonths = 3): MonthCompare {
  const curIdx = ymIndex(now);
  const avgStart = curIdx - avgMonths;
  let thisMonth = 0;
  let lastMonth = 0;
  let avgTotal = 0;
  for (const t of txns) {
    if (t.type !== "expense") continue;
    const idx = ymIndex(t.date);
    if (idx === curIdx) thisMonth += t.amount;
    else if (idx === curIdx - 1) lastMonth += t.amount;
    if (idx >= avgStart && idx < curIdx) avgTotal += t.amount;
  }
  const average = avgTotal / avgMonths;
  return {
    thisMonth,
    lastMonth,
    average,
    vsLastPct: lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null,
    vsAvgPct: average > 0 ? Math.round(((thisMonth - average) / average) * 100) : null,
  };
}

/** Essential (needs) vs discretionary (wants) split for the current month. */
export function essentialSplit(txns: Transaction[], now: number = Date.now()): { essential: number; discretionary: number } {
  const curIdx = ymIndex(now);
  let essential = 0;
  let discretionary = 0;
  for (const t of txns) {
    if (t.type !== "expense" || ymIndex(t.date) !== curIdx) continue;
    if (isEssential(t.category)) essential += t.amount;
    else discretionary += t.amount;
  }
  return { essential, discretionary };
}

/** Straight-line projection of this month's total spend from the pace so far. */
export function monthEndForecast(thisMonthSpend: number, now: number = Date.now()): number {
  const d = new Date(now);
  const day = d.getDate();
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  if (day <= 0) return thisMonthSpend;
  return Math.round(thisMonthSpend * (daysInMonth / day));
}

export interface SmartInsight {
  id: string;
  kind: "trend" | "anomaly" | "average" | "split" | "forecast";
  /** Category id when the insight is about one category. */
  category?: string;
  /** Signed percent, when relevant. */
  pct?: number;
  /** Primary amount in the display currency, when relevant. */
  amount?: number;
  /** Secondary amount (e.g. the average being compared to). */
  amount2?: number;
}

/**
 * A small, ranked set of structured intelligence signals for the UI to render as
 * plain language. Data only — no strings — so it's locale-agnostic and testable.
 */
export function smartInsights(txns: Transaction[], now: number = Date.now(), months = 3): SmartInsight[] {
  const out: SmartInsight[] = [];
  const cmp = monthComparison(txns, now, months);

  if (cmp.vsLastPct !== null && Math.abs(cmp.vsLastPct) >= 10) {
    out.push({ id: "trend", kind: "trend", pct: cmp.vsLastPct, amount: cmp.thisMonth });
  }

  // Predictive: where this month is heading at the current pace (mid-month only).
  const day = new Date(now).getDate();
  const daysInMonth = new Date(new Date(now).getFullYear(), new Date(now).getMonth() + 1, 0).getDate();
  if (cmp.thisMonth > 0 && day >= 5 && day <= daysInMonth - 3) {
    out.push({ id: "forecast", kind: "forecast", amount: monthEndForecast(cmp.thisMonth, now) });
  }

  for (const a of anomalies(txns, now, { months }).slice(0, 3)) {
    out.push({ id: `anomaly-${a.category}`, kind: "anomaly", category: a.category, pct: a.pct, amount: a.current, amount2: a.average });
  }

  const split = essentialSplit(txns, now);
  const total = split.essential + split.discretionary;
  if (total > 0) {
    out.push({ id: "split", kind: "split", amount: split.essential, amount2: split.discretionary });
  }

  return out;
}
