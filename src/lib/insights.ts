import type { Transaction } from "@/lib/types";

/**
 * RENEW — the autopilot brain. Turns a person's real transactions + recurring
 * money into a few honest, useful observations: what's safe to spend, where the
 * money went, the month-over-month trend, and what subscriptions really cost.
 * Pure and deterministic so it's unit-tested; the UI formats the numbers.
 */

export type InsightKind = "safe" | "top" | "trend" | "recurring";

export interface Insight {
  id: string;
  kind: InsightKind;
  /** Amount in the display currency, when relevant. */
  amount?: number;
  /** Expense category id (for "top"). */
  category?: string;
  /** Percent change vs last month (positive = spent more) — for "trend". */
  pct?: number;
  /** Number of active subscriptions — for "recurring". */
  count?: number;
}

function monthBounds(ref: number): { start: number; end: number; prevStart: number } {
  const d = new Date(ref);
  return {
    start: new Date(d.getFullYear(), d.getMonth(), 1).getTime(),
    end: new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime(),
    prevStart: new Date(d.getFullYear(), d.getMonth() - 1, 1).getTime(),
  };
}

export function computeInsights(input: {
  transactions: Transaction[];
  /** Monthly-equivalent cost of active subscriptions (display currency). */
  recurringMonthly: number;
  /** Count of active subscriptions. */
  activeSubs: number;
  /** Total of bills due this month that aren't paid yet (display currency). */
  upcomingBillsTotal: number;
  now?: number;
}): Insight[] {
  const now = input.now ?? Date.now();
  const { start, end, prevStart } = monthBounds(now);

  let mIncome = 0;
  let mExpense = 0;
  let prevExpense = 0;
  const byCat = new Map<string, number>();

  for (const t of input.transactions) {
    const inThis = t.date >= start && t.date < end;
    if (t.type === "income") {
      if (inThis) mIncome += t.amount;
      continue;
    }
    if (inThis) {
      mExpense += t.amount;
      byCat.set(t.category, (byCat.get(t.category) ?? 0) + t.amount);
    } else if (t.date >= prevStart && t.date < start) {
      prevExpense += t.amount;
    }
  }

  const out: Insight[] = [];

  // Safe to spend = income − spent − bills still due this month.
  if (mIncome > 0) {
    out.push({ id: "safe", kind: "safe", amount: mIncome - mExpense - input.upcomingBillsTotal });
  }

  // Biggest spending category this month.
  let topCat = "";
  let topAmt = 0;
  for (const [c, a] of byCat) {
    if (a > topAmt) {
      topAmt = a;
      topCat = c;
    }
  }
  if (topCat) out.push({ id: "top", kind: "top", category: topCat, amount: topAmt });

  // Trend vs last month.
  if (prevExpense > 0) {
    out.push({ id: "trend", kind: "trend", pct: Math.round(((mExpense - prevExpense) / prevExpense) * 100) });
  }

  // What recurring money really costs.
  if (input.activeSubs > 0) {
    out.push({ id: "recurring", kind: "recurring", amount: input.recurringMonthly, count: input.activeSubs });
  }

  return out.slice(0, 3);
}
