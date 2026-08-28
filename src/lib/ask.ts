import type { Transaction } from "@/lib/types";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "@/lib/finance";
import { essentialSplit } from "@/lib/intelligence";

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

/** A merchant/keyword named after "on/at/for" that isn't a known category,
 *  e.g. "how much at swiggy" → "swiggy". Used to search transaction notes. */
function detectMerchant(q: string): string | null {
  const m = q.match(/\b(?:on|at|for|from|to)\s+([a-z0-9][a-z0-9&.'\s-]{1,24}?)(?:\s+(?:this|last|in|during|so|over|per)\b|[?.!]|$)/);
  if (!m) return null;
  const term = m[1]!.trim().replace(/\s+/g, " ");
  if (term.length < 3) return null;
  const stop = /^(the|my|a|an|it|that|this|month|week|year|day|today|time|times|now|food|drink|transport|bills|shopping|groceries|health|travel|rent|fuel|phone|internet|subscriptions?|entertainment|clothing|education|insurance|fitness|savings?|income|salary)\b/;
  if (stop.test(term)) return null;
  return term;
}

function sum(txs: Transaction[], pred: (t: Transaction) => boolean): number {
  let s = 0;
  for (const t of txs) if (pred(t)) s += t.amount;
  return Math.round(s * 100) / 100;
}

/** Pull a money amount out of a question ("5,000", "₹5000", "2.5k"). */
export function parseAmountInQuestion(q: string): number | null {
  const m = q.match(/(\d[\d,]*(?:\.\d+)?)\s*(k|lakh|lakhs)?/);
  if (!m) return null;
  let n = Number(m[1]!.replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  if (m[2] === "k") n *= 1_000;
  else if (m[2]?.startsWith("lakh")) n *= 100_000;
  return n > 0 ? n : null;
}

/** Money in − out for the current month (the person's own numbers, factual). */
function leftoverThisMonth(ctx: AskContext, now: number): number {
  const { start, end } = bounds("this_month", now);
  const income = sum(ctx.transactions, (t) => t.type === "income" && t.date >= start && t.date < end);
  const expense = sum(ctx.transactions, (t) => t.type === "expense" && t.date >= start && t.date < end);
  return Math.round((income - expense) * 100) / 100;
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

  // Affordability — "can I afford 5000?" Factual: their own money in − out this
  // month vs the cost. Not advice, just their numbers laid next to the price.
  if (/afford|can i buy|enough for|enough to/.test(q)) {
    const cost = parseAmountInQuestion(q);
    const left = leftoverThisMonth(ctx, now);
    const bills = ctx.upcomingBillsTotal ?? 0;
    const safe = Math.round((left - bills) * 100) / 100;
    if (cost === null) {
      return { title: "Left to spend this month", value: safe, currency: ctx.currency, detail: bills > 0 ? "Money in − out, after bills still due." : "Money in − out so far this month." };
    }
    const after = Math.round((safe - cost) * 100) / 100;
    return {
      title: after >= 0 ? "Yes — that fits this month" : "That's more than you have left",
      value: after,
      currency: ctx.currency,
      detail: after >= 0 ? `You'd have this left after${bills > 0 ? " bills and" : ""} spending it.` : `You'd be short by this${bills > 0 ? " (after bills due)" : ""}.`,
    };
  }

  // How much is left / safe to spend this month.
  if (/left to spend|how much left|left this month|safe to spend|can i spend|spare/.test(q)) {
    const safe = Math.round((leftoverThisMonth(ctx, now) - (ctx.upcomingBillsTotal ?? 0)) * 100) / 100;
    return { title: "Left to spend this month", value: safe, currency: ctx.currency, detail: (ctx.upcomingBillsTotal ?? 0) > 0 ? "Money in − out, after bills still due." : "Money in − out so far this month." };
  }

  // Subscriptions / recurring cost.
  if (/subscription|recurring/.test(q)) {
    return { title: "Subscriptions", value: ctx.monthlySubs, currency: ctx.currency, detail: `${ctx.activeSubs} active · about this per month` };
  }

  // Savings rate — how much (and what share of income) is kept.
  if (/saving rate|savings rate|how much.*sav|am i saving|save this|did i save/.test(q)) {
    const income = sum(ctx.transactions, (t) => t.type === "income" && inRange(t));
    const expense = sum(ctx.transactions, (t) => t.type === "expense" && inRange(t));
    const saved = Math.round((income - expense) * 100) / 100;
    const rate = income > 0 ? Math.round((saved / income) * 100) : null;
    return { title: `Saved ${TF_LABEL[tf]}`, value: saved, currency: ctx.currency, detail: rate !== null ? `${rate}% of your income ${TF_LABEL[tf]}.` : "Add income to see your savings rate." };
  }

  // Needs vs wants (essential vs discretionary) this month.
  if (/needs? vs wants?|wants? vs needs?|essential|discretionary|needs and wants|wants and needs/.test(q)) {
    const { essential, discretionary } = essentialSplit(ctx.transactions, now);
    const total = essential + discretionary;
    const pct = total > 0 ? Math.round((essential / total) * 100) : 0;
    return { title: "Needs vs wants this month", value: Math.round(essential * 100) / 100, currency: ctx.currency, detail: total > 0 ? `on needs (${pct}%). The rest, ${Math.round(discretionary * 100) / 100}, went on wants.` : "Add spending to see the split." };
  }

  // Biggest single transaction (as opposed to biggest category).
  if (/biggest|largest|most expensive|top/.test(q) && /purchase|transaction|expense|buy|bought|single|item|one thing|payment/.test(q)) {
    let top: Transaction | null = null;
    for (const t of ctx.transactions) if (t.type === "expense" && inRange(t) && (!top || t.amount > top.amount)) top = t;
    if (!top) return { title: `No spending ${TF_LABEL[tf]}`, detail: "Add a transaction to see this." };
    const label = [...EXPENSE_CATEGORIES].find((c) => c.id === top!.category)?.label ?? top.category;
    return { title: `Biggest single expense ${TF_LABEL[tf]}`, value: Math.round(top.amount * 100) / 100, currency: ctx.currency, detail: top.note ? `${top.note} · ${label}` : label };
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

  // Comparison — this month vs last month spending.
  if (/compare|more than|less than|vs last|versus last|than last month/.test(q)) {
    const thisB = bounds("this_month", now);
    const lastB = bounds("last_month", now);
    const thisSpend = sum(ctx.transactions, (t) => t.type === "expense" && t.date >= thisB.start && t.date < thisB.end);
    const lastSpend = sum(ctx.transactions, (t) => t.type === "expense" && t.date >= lastB.start && t.date < lastB.end);
    const diff = Math.round((thisSpend - lastSpend) * 100) / 100;
    const pct = lastSpend > 0 ? Math.round((diff / lastSpend) * 100) : null;
    const detail =
      diff === 0 ? "Exactly the same as last month."
      : diff > 0 ? `${pct !== null ? `${pct}% ` : ""}more than last month (${lastSpend} then).`
      : `${pct !== null ? `${Math.abs(pct)}% ` : ""}less than last month (${lastSpend} then) — nice.`;
    return { title: "Spending vs last month", value: thisSpend, currency: ctx.currency, detail };
  }

  // Average per day this month.
  if (/average|per day|daily|a day/.test(q)) {
    const { start, end } = bounds("this_month", now);
    const spent = sum(ctx.transactions, (t) => t.type === "expense" && t.date >= start && t.date < end);
    const day = new Date(now).getDate();
    return { title: "Average spend per day", value: Math.round((spent / Math.max(1, day)) * 100) / 100, currency: ctx.currency, detail: `Across ${day} day${day === 1 ? "" : "s"} this month.` };
  }

  // Income / earnings.
  if (/income|earn|earned|salary|made|revenue/.test(q)) {
    const cat = detectCategory(q);
    const v = sum(ctx.transactions, (t) => t.type === "income" && inRange(t) && (!cat || t.category === cat.id));
    return { title: cat ? `${cat.label} income ${TF_LABEL[tf]}` : `Income ${TF_LABEL[tf]}`, value: v, currency: ctx.currency };
  }

  // Spending — by category, by merchant (note search), or overall.
  const cat = detectCategory(q);
  const merchant = cat ? null : detectMerchant(q);
  if (/spen|spent|cost|paid|expense|much on|much for/.test(q) || cat || merchant) {
    const v = sum(ctx.transactions, (t) =>
      t.type === "expense" && inRange(t)
      && (cat ? t.category === cat.id : true)
      && (merchant ? (t.note ?? "").toLowerCase().includes(merchant) : true),
    );
    const pretty = merchant ? merchant.replace(/\b\w/g, (c) => c.toUpperCase()) : "";
    const title = cat ? `${cat.label} ${TF_LABEL[tf]}` : merchant ? `Spent on ${pretty} ${TF_LABEL[tf]}` : `Spending ${TF_LABEL[tf]}`;
    return { title, value: v, currency: ctx.currency };
  }

  return null;
}
