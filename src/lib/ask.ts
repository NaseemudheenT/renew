import type { Transaction } from "@/lib/types";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "@/lib/finance";

/**
 * "Ask Renew" — Phase 3 (Money Assistant), the honest, no-cost first version.
 *
 * It answers real questions about a person's money DETERMINISTICALLY, straight
 * from their own transactions — no LLM, no data leaving the device, no made-up
 * numbers. It recognises a timeframe (this/last month, this year, all time), an
 * optional category, and an intent (spent / earned / biggest / subscriptions /
 * net worth). When it can't understand a free-text question it returns null so
 * the UI can offer the quick questions instead. When an LLM is added later, this
 * stays the grounded math layer it can call.
 */

export type Timeframe = "this_month" | "last_month" | "this_year" | "all";

export interface AskContext {
  transactions: Transaction[];
  netWorth: number;
  monthlySubs: number;
  activeSubs: number;
  /** Bills due this month that aren't paid yet (display currency). */
  upcomingBillsTotal?: number;
  currency: string;
  now?: number;
}

export interface AskAnswer {
  title: string;
  /** A money figure to render prominently, when the answer is an amount. */
  value?: number;
  currency?: string;
  /** A short supporting line. */
  detail?: string;
}

function bounds(tf: Timeframe, now: number): { start: number; end: number } {
  const d = new Date(now);
  switch (tf) {
    case "last_month":
      return { start: new Date(d.getFullYear(), d.getMonth() - 1, 1).getTime(), end: new Date(d.getFullYear(), d.getMonth(), 1).getTime() };
    case "this_year":
      return { start: new Date(d.getFullYear(), 0, 1).getTime(), end: new Date(d.getFullYear() + 1, 0, 1).getTime() };
    case "all":
      return { start: 0, end: Number.MAX_SAFE_INTEGER };
    case "this_month":
    default:
      return { start: new Date(d.getFullYear(), d.getMonth(), 1).getTime(), end: new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime() };
  }
}

const TF_LABEL: Record<Timeframe, string> = {
  this_month: "this month",
  last_month: "last month",
  this_year: "this year",
  all: "all time",
};

function detectTimeframe(q: string): Timeframe {
  if (/last month|previous month/.test(q)) return "last_month";
  if (/this year|year|annual|ytd/.test(q)) return "this_year";
  if (/all time|ever|total|overall|so far/.test(q)) return "all";
  return "this_month";
}

/** Find a category id named in the question (built-in categories only). */
function detectCategory(q: string): { id: string; label: string } | null {
  const all = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
  // Longest label first so "Food & Drink" beats "Food"-like partials.
  const sorted = [...all].sort((a, b) => b.label.length - a.label.length);
  for (const c of sorted) {
    const word = c.label.toLowerCase().split(" ")[0]!; // "food & drink" → "food"
    if (q.includes(c.label.toLowerCase()) || (word.length >= 3 && q.includes(word))) {
      return { id: c.id, label: c.label };
    }
  }
  return null;
}

function sum(txs: Transaction[], pred: (t: Transaction) => boolean): number {
  let s = 0;
  for (const t of txs) if (pred(t)) s += t.amount;
  return Math.round(s * 100) / 100;
}

/** Answer a free-text question, or null if it can't be understood. */
export function answerQuestion(question: string, ctx: AskContext): AskAnswer | null {
  const q = question.toLowerCase().trim();
  if (!q) return null;
  const now = ctx.now ?? Date.now();
  const tf = detectTimeframe(q);
  const { start, end } = bounds(tf, now);
  const inRange = (t: Transaction) => t.date >= start && t.date < end;

  // Net worth / balance.
  if (/net worth|how much do i have|my balance|total money/.test(q)) {
    return { title: "Your net worth", value: ctx.netWorth, currency: ctx.currency };
  }

  // Predictive: projected month-end spending at the current pace (deterministic).
  if (/on track|forecast|month.?end|end of the month|overspend|will i|run out|pace/.test(q)) {
    const d = new Date(now);
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const dayOfMonth = d.getDate();
    const daysLeft = Math.max(0, daysInMonth - dayOfMonth);
    const { start, end } = bounds("this_month", now);
    const spentSoFar = sum(ctx.transactions, (t) => t.type === "expense" && t.date >= start && t.date < end);
    const dailyRate = spentSoFar / Math.max(1, dayOfMonth);
    const projected = Math.round((spentSoFar + dailyRate * daysLeft + (ctx.upcomingBillsTotal ?? 0)) * 100) / 100;
    return {
      title: "Projected spending this month",
      value: projected,
      currency: ctx.currency,
      detail: `At your current pace, with ${daysLeft} day${daysLeft === 1 ? "" : "s"} left${ctx.upcomingBillsTotal ? " (incl. bills due)" : ""}.`,
    };
  }

  // Subscriptions / recurring cost.
  if (/subscription|recurring/.test(q)) {
    return { title: "Subscriptions", value: ctx.monthlySubs, currency: ctx.currency, detail: `${ctx.activeSubs} active · about this per month` };
  }

  // Biggest expense category in the timeframe.
  if (/biggest|most|top|largest|highest/.test(q)) {
    const byCat = new Map<string, number>();
    for (const t of ctx.transactions) if (t.type === "expense" && inRange(t)) byCat.set(t.category, (byCat.get(t.category) ?? 0) + t.amount);
    let cat = "", amt = 0;
    for (const [c, a] of byCat) if (a > amt) { amt = a; cat = c; }
    if (!cat) return { title: `No spending ${TF_LABEL[tf]}`, detail: "Add a transaction to see this." };
    const label = [...EXPENSE_CATEGORIES].find((c) => c.id === cat)?.label ?? cat;
    return { title: `Biggest spend ${TF_LABEL[tf]}`, value: Math.round(amt * 100) / 100, currency: ctx.currency, detail: label };
  }

  // Income / earnings.
  if (/income|earn|earned|salary|made|revenue/.test(q)) {
    const cat = detectCategory(q);
    const v = sum(ctx.transactions, (t) => t.type === "income" && inRange(t) && (!cat || t.category === cat.id));
    return { title: cat ? `${cat.label} income ${TF_LABEL[tf]}` : `Income ${TF_LABEL[tf]}`, value: v, currency: ctx.currency };
  }

  // Spending — the default when a category and/or "spend" is present.
  const cat = detectCategory(q);
  if (/spen|spent|cost|paid|expense|much on|much for/.test(q) || cat) {
    const v = sum(ctx.transactions, (t) => t.type === "expense" && inRange(t) && (!cat || t.category === cat.id));
    return { title: cat ? `${cat.label} ${TF_LABEL[tf]}` : `Spending ${TF_LABEL[tf]}`, value: v, currency: ctx.currency };
  }

  return null;
}
