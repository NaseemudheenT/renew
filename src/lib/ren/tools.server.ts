import "server-only";

import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { timeframeBounds, resolveDate, type Timeframe } from "./dates";
import {
  getSummaryArgs, searchTransactionsArgs, analyzeSpendingArgs, comparePeriodsArgs, affordabilityArgs,
  createTransactionArgs, updateTransactionArgs, deleteTransactionArgs, createReminderArgs,
  createBudgetArgs, createSavingsGoalArgs,
} from "./schemas";

/**
 * REN tools — the ONLY way REN touches data (spec §8/§10/§12). Each tool is
 * session-scoped to the authenticated uid (never a client-supplied id), strictly
 * validated by its Zod schema, and reads/writes only that user's own subtree.
 * The AI model never sees the database — it can only request one of these tools,
 * and the orchestrator runs it. Reads compute from real data; a tool with no
 * data returns empty, never invented numbers (spec §17).
 */

export interface RenContext {
  uid: string;
  currency: string;
  timezone: string;
  workspace: "personal" | "business";
  now: number;
}

export type RiskLevel = "read" | "low" | "high";

interface Tool<A extends z.ZodTypeAny> {
  name: string;
  description: string;
  schema: A;
  risk: RiskLevel;
  execute: (ctx: RenContext, args: z.infer<A>) => Promise<unknown>;
}

const noArgs = z.object({});

function col(uid: string, name: string) {
  return getAdminDb().collection("users").doc(uid).collection(name);
}

/** Load a bounded slice of the user's transactions (newest first), workspace-scoped. */
async function loadTransactions(ctx: RenContext, max = 2000) {
  const snap = await col(ctx.uid, "transactions").orderBy("date", "desc").limit(max).get();
  const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));
  return rows.filter((t) => {
    const scope = (t as { scope?: string }).scope;
    return !scope || scope === ctx.workspace; // pre-workspace rows count as personal
  }) as Array<{ id: string; type: string; amount: number; category: string; note?: string; date: number; currency?: string }>;
}

function sumInRange(txns: Awaited<ReturnType<typeof loadTransactions>>, type: string, start: number, end: number) {
  return txns.reduce((s, t) => (t.type === type && t.date >= start && t.date < end ? s + t.amount : s), 0);
}

/* ---- READ / ANALYTICAL --------------------------------------------------- */

const getFinancialSummary: Tool<typeof getSummaryArgs> = {
  name: "get_financial_summary",
  description: "Totals for a timeframe: money in, money out, net, and net worth. Use for 'how am I doing', balances, net worth.",
  schema: getSummaryArgs, risk: "read",
  async execute(ctx, { timeframe }) {
    const txns = await loadTransactions(ctx);
    const { start, end } = timeframeBounds(timeframe as Timeframe, ctx.timezone, ctx.now);
    const income = sumInRange(txns, "income", start, end);
    const expense = sumInRange(txns, "expense", start, end);
    const allIncome = txns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const allExpense = txns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const savingsSnap = await col(ctx.uid, "savings").get();
    const savings = savingsSnap.docs.reduce((s, d) => s + Number((d.data() as { current?: number }).current ?? 0), 0);
    return {
      timeframe, currency: ctx.currency,
      moneyIn: Math.round(income), moneyOut: Math.round(expense), net: Math.round(income - expense),
      netWorth: Math.round(allIncome - allExpense + savings), savingsTotal: Math.round(savings),
    };
  },
};

const searchTransactions: Tool<typeof searchTransactionsArgs> = {
  name: "search_transactions",
  description: "Find the user's transactions by text, category, type and timeframe. Use for 'what did I spend on X', 'show my recent expenses', 'biggest purchase'.",
  schema: searchTransactionsArgs, risk: "read",
  async execute(ctx, { query, type, category, timeframe, limit }) {
    const txns = await loadTransactions(ctx);
    const { start, end } = timeframeBounds(timeframe as Timeframe, ctx.timezone, ctx.now);
    const q = query?.toLowerCase();
    const matched = txns.filter((t) =>
      t.date >= start && t.date < end &&
      (!type || t.type === type) &&
      (!category || t.category === category) &&
      (!q || (t.note ?? "").toLowerCase().includes(q) || t.category.toLowerCase().includes(q)),
    );
    const total = matched.reduce((s, t) => s + t.amount, 0);
    return {
      timeframe, currency: ctx.currency, count: matched.length, total: Math.round(total),
      transactions: matched.slice(0, limit).map((t) => ({ id: t.id, type: t.type, amount: Math.round(t.amount), category: t.category, note: t.note ?? "", date: t.date })),
    };
  },
};

const analyzeSpending: Tool<typeof analyzeSpendingArgs> = {
  name: "analyze_spending",
  description: "Break spending down by category for a timeframe (optionally one category). Use for 'where does my money go', 'biggest expenses'.",
  schema: analyzeSpendingArgs, risk: "read",
  async execute(ctx, { timeframe, category }) {
    const txns = await loadTransactions(ctx);
    const { start, end } = timeframeBounds(timeframe as Timeframe, ctx.timezone, ctx.now);
    const byCat = new Map<string, number>();
    for (const t of txns) if (t.type === "expense" && t.date >= start && t.date < end && (!category || t.category === category)) byCat.set(t.category, (byCat.get(t.category) ?? 0) + t.amount);
    const rows = [...byCat.entries()].map(([c, a]) => ({ category: c, amount: Math.round(a) })).sort((a, b) => b.amount - a.amount);
    return { timeframe, currency: ctx.currency, total: rows.reduce((s, r) => s + r.amount, 0), byCategory: rows };
  },
};

const comparePeriods: Tool<typeof comparePeriodsArgs> = {
  name: "compare_periods",
  description: "Compare this month's spending with last month (optionally one category). Use for 'more or less than last month', 'why did I spend more'.",
  schema: comparePeriodsArgs, risk: "read",
  async execute(ctx, { category }) {
    const txns = await loadTransactions(ctx);
    const inCat = (t: { category: string }) => !category || t.category === category;
    const cur = timeframeBounds("this_month", ctx.timezone, ctx.now);
    const prev = timeframeBounds("last_month", ctx.timezone, ctx.now);
    const spend = (b: { start: number; end: number }) => txns.filter((t) => t.type === "expense" && inCat(t) && t.date >= b.start && t.date < b.end).reduce((s, t) => s + t.amount, 0);
    const thisMonth = Math.round(spend(cur));
    const lastMonth = Math.round(spend(prev));
    return { currency: ctx.currency, thisMonth, lastMonth, changePct: lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null };
  },
};

const calculateAffordability: Tool<typeof affordabilityArgs> = {
  name: "calculate_affordability",
  description: "Whether a cost fits this month: money in − out so far minus upcoming unpaid bills, vs the amount. Use for 'can I afford X'.",
  schema: affordabilityArgs, risk: "read",
  async execute(ctx, { amount }) {
    const txns = await loadTransactions(ctx);
    const { start, end } = timeframeBounds("this_month", ctx.timezone, ctx.now);
    const left = sumInRange(txns, "income", start, end) - sumInRange(txns, "expense", start, end);
    const billsSnap = await col(ctx.uid, "payments").get();
    const bills = billsSnap.docs.map((d) => d.data() as { status?: string; amount?: number }).filter((b) => b.status !== "paid").reduce((s, b) => s + Number(b.amount ?? 0), 0);
    const safe = Math.round(left - bills);
    return { currency: ctx.currency, leftThisMonth: safe, cost: Math.round(amount), fits: safe >= amount, remainingAfter: Math.round(safe - amount) };
  },
};

const listUpcomingBills: Tool<typeof noArgs> = {
  name: "list_upcoming_bills",
  description: "The user's upcoming and overdue bills. Use for 'what bills are coming up'.",
  schema: noArgs, risk: "read",
  async execute(ctx) {
    const snap = await col(ctx.uid, "payments").get();
    const bills = snap.docs.map((d) => d.data() as { name?: string; amount?: number; dueAt?: number; status?: string })
      .filter((b) => b.status !== "paid").sort((a, b) => (a.dueAt ?? 0) - (b.dueAt ?? 0));
    return { currency: ctx.currency, count: bills.length, total: Math.round(bills.reduce((s, b) => s + Number(b.amount ?? 0), 0)), bills: bills.slice(0, 15).map((b) => ({ name: b.name, amount: Math.round(Number(b.amount ?? 0)), dueAt: b.dueAt, status: b.status })) };
  },
};

const listSubscriptions: Tool<typeof noArgs> = {
  name: "list_subscriptions",
  description: "The user's active subscriptions. Use for 'show my subscriptions', 'what am I paying for'.",
  schema: noArgs, risk: "read",
  async execute(ctx) {
    const snap = await col(ctx.uid, "subscriptions").get();
    const subs = snap.docs.map((d) => d.data() as { name?: string; price?: number; cycle?: string; status?: string; nextBillingAt?: number }).filter((s) => s.status === "active");
    return { currency: ctx.currency, count: subs.length, subscriptions: subs.map((s) => ({ name: s.name, price: Math.round(Number(s.price ?? 0)), cycle: s.cycle, nextBillingAt: s.nextBillingAt })) };
  },
};

/* ---- WRITE --------------------------------------------------------------- */

const createTransaction: Tool<typeof createTransactionArgs> = {
  name: "create_transaction",
  description: "Record a new income or expense. Only call when amount, type and category are known (ask the user otherwise — never invent them).",
  schema: createTransactionArgs, risk: "low",
  async execute(ctx, a) {
    const ref = await col(ctx.uid, "transactions").add({
      scope: ctx.workspace, type: a.type, amount: a.amount, currency: a.currency ?? ctx.currency,
      category: a.category, subcategory: "", note: a.note ?? "", accountId: "",
      date: resolveDate(a.date, ctx.timezone, ctx.now),
      createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
    });
    return { id: ref.id, ok: true, type: a.type, amount: a.amount, currency: a.currency ?? ctx.currency, category: a.category };
  },
};

const updateTransaction: Tool<typeof updateTransactionArgs> = {
  name: "update_transaction",
  description: "Change an existing transaction by id (e.g. 'make that 500'). Confirm the target with the user first.",
  schema: updateTransactionArgs, risk: "high",
  async execute(ctx, a) {
    const patch: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
    if (a.amount != null) patch.amount = a.amount;
    if (a.category != null) patch.category = a.category;
    if (a.note != null) patch.note = a.note;
    if (a.date != null) patch.date = resolveDate(a.date, ctx.timezone, ctx.now);
    await col(ctx.uid, "transactions").doc(a.id).update(patch);
    return { id: a.id, ok: true };
  },
};

const deleteTransaction: Tool<typeof deleteTransactionArgs> = {
  name: "delete_transaction",
  description: "Delete a transaction by id. Always confirm with the user before calling.",
  schema: deleteTransactionArgs, risk: "high",
  async execute(ctx, a) {
    await col(ctx.uid, "transactions").doc(a.id).delete();
    return { id: a.id, ok: true };
  },
};

const createReminder: Tool<typeof createReminderArgs> = {
  name: "create_reminder",
  description: "Add a reminder for the user on a date (optional time). Use for 'remind me about X'.",
  schema: createReminderArgs, risk: "low",
  async execute(ctx, a) {
    const dueAt = resolveDate(a.date, ctx.timezone, ctx.now);
    const ref = await col(ctx.uid, "reminders").add({
      scope: ctx.workspace, title: a.title, dueAt, hasTime: !!a.time, notes: "",
      category: "other", priority: "normal", repeat: "none", completed: false, completedAt: null,
      createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
    });
    return { id: ref.id, ok: true, title: a.title, dueAt };
  },
};

const createBudget: Tool<typeof createBudgetArgs> = {
  name: "create_budget",
  description: "Set a monthly budget for a category. Use for 'set a food budget of X'.",
  schema: createBudgetArgs, risk: "low",
  async execute(ctx, a) {
    const ref = await col(ctx.uid, "budgets").add({
      scope: ctx.workspace, category: a.category, amount: a.amount, currency: a.currency ?? ctx.currency,
      createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
    });
    return { id: ref.id, ok: true, category: a.category, amount: a.amount };
  },
};

const createSavingsGoal: Tool<typeof createSavingsGoalArgs> = {
  name: "create_savings_goal",
  description: "Create a savings goal with a target amount. Use for 'save X for Y'.",
  schema: createSavingsGoalArgs, risk: "low",
  async execute(ctx, a) {
    const ref = await col(ctx.uid, "savings").add({
      scope: ctx.workspace, name: a.name, target: a.target, current: 0, currency: a.currency ?? ctx.currency,
      targetDate: null, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
    });
    return { id: ref.id, ok: true, name: a.name, target: a.target };
  },
};

export const REN_TOOLS: Tool<any>[] = [
  getFinancialSummary, searchTransactions, analyzeSpending, comparePeriods, calculateAffordability,
  listUpcomingBills, listSubscriptions,
  createTransaction, updateTransaction, deleteTransaction, createReminder, createBudget, createSavingsGoal,
];

export const TOOL_BY_NAME: Record<string, Tool<any>> = Object.fromEntries(REN_TOOLS.map((t) => [t.name, t]));

/** JSON-schema tool definitions for the LLM (name/description/input schema). */
export function toolDefsForLLM() {
  return REN_TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: z.toJSONSchema(t.schema, { target: "draft-7" }) as Record<string, unknown>,
  }));
}
