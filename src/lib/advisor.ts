import type { Transaction, Subscription, Payment, Budget, SavingsGoal } from "@/lib/types";
import {
  anomalies, monthComparison, monthEndForecast, categoryAverages,
  essentialSplit, savingsProjection, monthsSince,
} from "@/lib/intelligence";
import { subscriptionMonthly } from "@/lib/accounts";

/**
 * RENEW — the Advisor. The deterministic recommendation engine behind Renew's
 * suggestion service.
 *
 * Where `intelligence.ts` *observes* ("dining is up 40%"), the Advisor *advises*
 * ("dining is over your usual — a ₹X budget keeps it in check"). Every number
 * comes from the person's OWN data — bills, budgets, subscriptions, savings,
 * income and spending — never a guess and never an LLM (Constitution §14/§18).
 * A future LLM layer may *phrase* these suggestions, but the analysis stays here,
 * so a suggestion is always arithmetically correct. Output is structured data
 * (no strings) so the UI formats money in the user's own locale and it stays
 * unit-testable.
 */

export type SuggestionKind =
  | "overdue_bill"
  | "bill_due_soon"
  | "negative_cashflow"
  | "overspend_pace"
  | "over_budget"
  | "no_budget"
  | "category_spike"
  | "subscription_review"
  | "subscription_renewing"
  | "high_wants"
  | "save_surplus"
  | "goal_reached"
  | "goal_pace"
  | "add_income"
  | "spending_down"
  | "healthy_savings";

/** urgent = act now · opportunity = save money · info = worth knowing · good = well done. */
export type Severity = "urgent" | "opportunity" | "info" | "good";

export interface Suggestion {
  id: string;
  kind: SuggestionKind;
  severity: Severity;
  /** Category id, when the suggestion is about one category. */
  category?: string;
  /** A thing's name (bill, subscription, goal), when relevant. */
  name?: string;
  /** Primary amount in the display currency. */
  amount?: number;
  /** Secondary amount (a budget limit, an average, an annualised figure). */
  amount2?: number;
  /** Signed/percent value, when relevant. */
  pct?: number;
  /** A count (subscriptions, bills). */
  count?: number;
  /** Days until something happens. */
  days?: number;
  /** Where tapping the suggestion takes the person to act on it. */
  action?: { label: string; href: string };
}

const SEVERITY_WEIGHT: Record<Severity, number> = { urgent: 3, opportunity: 2, info: 1, good: 0 };

export interface AdvisorInput {
  transactions: Transaction[];
  subscriptions?: Subscription[];
  bills?: Payment[];
  budgets?: Budget[];
  goals?: SavingsGoal[];
  now?: number;
  /** How many suggestions to return, most important first. Default 5. */
  max?: number;
  /** Trailing months used for averages. Default 3. */
  avgMonths?: number;
  /** Income the person declared at setup (display currency). Used ONLY as a
   *  fallback when there isn't yet real income history to average — so a brand
   *  new account still gets meaningful advice. Real transactions always win. */
  declaredMonthlyIncome?: number;
}

const DAY = 86_400_000;

function ymIndex(ts: number): number {
  const d = new Date(ts);
  return d.getFullYear() * 12 + d.getMonth();
}

/** Average monthly income over the `months` complete months before this one. */
function monthlyIncomeAverage(txns: Transaction[], months: number, now: number): number {
  const cur = ymIndex(now);
  const start = cur - months;
  let total = 0;
  for (const t of txns) {
    if (t.type !== "income") continue;
    const idx = ymIndex(t.date);
    if (idx >= start && idx < cur) total += t.amount;
  }
  return total / months;
}

/** This-month totals we reuse across several rules. */
function thisMonthTotals(txns: Transaction[], now: number) {
  const cur = ymIndex(now);
  let income = 0;
  let expense = 0;
  const byCategory = new Map<string, number>();
  for (const t of txns) {
    if (ymIndex(t.date) !== cur) continue;
    if (t.type === "income") income += t.amount;
    else if (t.type === "expense") {
      expense += t.amount;
      byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + t.amount);
    }
  }
  return { income, expense, byCategory };
}

/** Whole days from now until a future timestamp (negative if past). */
function daysUntil(ts: number, now: number): number {
  return Math.ceil((ts - now) / DAY);
}

/**
 * The heart of the suggestion service: a ranked, de-duplicated set of concrete,
 * correct recommendations built entirely from the person's real data.
 */
export function suggestions(input: AdvisorInput): Suggestion[] {
  const now = input.now ?? Date.now();
  const months = input.avgMonths ?? 3;
  const txns = input.transactions;
  const bills = input.bills ?? [];
  const subs = (input.subscriptions ?? []).filter((s) => s.status === "active");
  const budgets = input.budgets ?? [];
  const goals = input.goals ?? [];

  const out: Suggestion[] = [];
  const { income: incomeThisMonth, expense: expenseThisMonth, byCategory } = thisMonthTotals(txns, now);
  // Real averaged income wins; only fall back to the declared setup figure when
  // there's no income history yet, so new accounts still get useful advice.
  const averaged = monthlyIncomeAverage(txns, months, now);
  const declared = input.declaredMonthlyIncome && input.declaredMonthlyIncome > 0 ? input.declaredMonthlyIncome : 0;
  const incomeAvg = averaged > 0 ? averaged : declared;
  const forecastSpend = monthEndForecast(expenseThisMonth, now);
  const cmp = monthComparison(txns, now, months);
  const hasExpenses = txns.some((t) => t.type === "expense");

  // 1) Overdue bills — the most urgent thing there is.
  const overdue = bills.filter((b) => b.status !== "paid" && (b.status === "overdue" || b.dueAt < now));
  if (overdue.length > 0) {
    const total = overdue.reduce((s, b) => s + b.amount, 0);
    out.push({
      id: "overdue", kind: "overdue_bill", severity: "urgent",
      amount: Math.round(total), count: overdue.length,
      name: overdue.length === 1 ? overdue[0]!.name : undefined,
      action: { label: "Review bills", href: "/payments" },
    });
  }

  // 2) A bill due within 3 days (and not already overdue).
  const dueSoon = bills
    .filter((b) => b.status !== "paid" && b.dueAt >= now && b.dueAt <= now + 3 * DAY)
    .sort((a, b) => a.dueAt - b.dueAt);
  if (dueSoon.length > 0) {
    const b = dueSoon[0]!;
    out.push({
      id: `due-${b.id}`, kind: "bill_due_soon", severity: "urgent",
      name: b.name, amount: Math.round(b.amount), days: Math.max(0, daysUntil(b.dueAt, now)),
      action: { label: "Open bills", href: "/payments" },
    });
  }

  // 3) On track to spend more than you earn this month.
  let cashflowFlagged = false;
  if (incomeAvg > 0 && forecastSpend > incomeAvg) {
    cashflowFlagged = true;
    out.push({
      id: "cashflow", kind: "negative_cashflow", severity: "urgent",
      amount: Math.round(forecastSpend), amount2: Math.round(incomeAvg),
      action: { label: "See spending", href: "/analytics" },
    });
  }

  // 4) Spending pace well above your usual (skip if we already warned about cashflow).
  if (!cashflowFlagged && expenseThisMonth > 0 && cmp.vsAvgPct !== null && cmp.vsAvgPct >= 15) {
    const day = new Date(now).getDate();
    if (day >= 5) {
      out.push({
        id: "pace", kind: "overspend_pace", severity: "opportunity",
        amount: Math.round(forecastSpend), pct: cmp.vsAvgPct,
        action: { label: "See spending", href: "/analytics" },
      });
    }
  }

  // 5) Over a budget you set. Show the two worst.
  const overBudget = budgets
    .map((bg) => ({ bg, spent: byCategory.get(bg.category) ?? 0 }))
    .filter((x) => x.bg.amount > 0 && x.spent > x.bg.amount)
    .sort((a, b) => (b.spent - b.bg.amount) - (a.spent - a.bg.amount));
  const overBudgetCats = new Set(overBudget.map((x) => x.bg.category));
  for (const x of overBudget.slice(0, 2)) {
    out.push({
      id: `overbudget-${x.bg.category}`, kind: "over_budget", severity: "opportunity",
      category: x.bg.category, amount: Math.round(x.spent), amount2: Math.round(x.bg.amount),
      pct: Math.round(((x.spent - x.bg.amount) / x.bg.amount) * 100),
      action: { label: "Adjust budget", href: "/budget" },
    });
  }

  // 6) A big, steady spend category with no budget yet.
  const avgByCat = categoryAverages(txns, months, now);
  const budgetedCats = new Set(budgets.map((b) => b.category));
  const noBudget = [...avgByCat.entries()]
    .filter(([c, avg]) => !budgetedCats.has(c) && avg > 0)
    .sort((a, b) => b[1] - a[1]);
  const totalAvg = [...avgByCat.values()].reduce((s, v) => s + v, 0);
  if (noBudget.length > 0 && totalAvg > 0) {
    const [cat, avg] = noBudget[0]!;
    // Only worth suggesting when it's a meaningful slice of spending.
    if (avg >= totalAvg * 0.15) {
      out.push({
        id: `nobudget-${cat}`, kind: "no_budget", severity: "opportunity",
        category: cat, amount: Math.round(avg),
        action: { label: "Set a budget", href: "/budget" },
      });
    }
  }

  // 7) A category spiking above its own average (not already covered by a budget alert).
  const spike = anomalies(txns, now, { months }).find((a) => !overBudgetCats.has(a.category));
  if (spike) {
    out.push({
      id: `spike-${spike.category}`, kind: "category_spike", severity: "info",
      category: spike.category, amount: Math.round(spike.current), amount2: Math.round(spike.average),
      pct: spike.pct, action: { label: "See spending", href: "/analytics" },
    });
  }

  // 8) A subscription renewing within 5 days.
  const renewing = subs
    .filter((s) => s.nextBillingAt >= now && s.nextBillingAt <= now + 5 * DAY)
    .sort((a, b) => a.nextBillingAt - b.nextBillingAt);
  if (renewing.length > 0) {
    const s = renewing[0]!;
    out.push({
      id: `renew-${s.id}`, kind: "subscription_renewing", severity: "info",
      name: s.name, amount: Math.round(s.price), days: Math.max(0, daysUntil(s.nextBillingAt, now)),
      action: { label: "Manage", href: "/payments#subscriptions" },
    });
  }

  // 9) Subscriptions worth a review (several of them, or a big monthly chunk).
  const subsMonthly = subs.reduce((s, x) => s + subscriptionMonthly(x), 0);
  const subsHeavy = incomeAvg > 0 && subsMonthly >= incomeAvg * 0.1;
  if (subs.length >= 3 || (subs.length >= 1 && subsHeavy)) {
    out.push({
      id: "subs", kind: "subscription_review", severity: "opportunity",
      amount: Math.round(subsMonthly), amount2: Math.round(subsMonthly * 12), count: subs.length,
      action: { label: "Review subscriptions", href: "/payments#subscriptions" },
    });
  }

  // 10) Most of this month's spending is wants over needs.
  const split = essentialSplit(txns, now);
  if (split.discretionary > 0 && split.essential >= 0 && split.discretionary > split.essential * 1.2 && split.discretionary >= 1) {
    out.push({
      id: "wants", kind: "high_wants", severity: "info",
      amount: Math.round(split.discretionary), amount2: Math.round(split.essential),
      action: { label: "See breakdown", href: "/analytics" },
    });
  }

  // 11) Savings goals — celebrate a reached one, or nudge the nearest in progress.
  const reached = goals.find((g) => g.target > 0 && g.current >= g.target);
  if (reached) {
    out.push({
      id: `goal-done-${reached.id}`, kind: "goal_reached", severity: "good",
      name: reached.name, amount: Math.round(reached.target),
      action: { label: "Open savings", href: "/savings" },
    });
  }
  const inProgress = goals
    .filter((g) => g.target > 0 && g.current < g.target)
    .map((g) => ({ g, proj: savingsProjection(g.current, g.target, monthsSince(g.createdAt, now)) }))
    .sort((a, b) => (b.g.current / b.g.target) - (a.g.current / a.g.target));
  if (inProgress.length > 0) {
    const { g, proj } = inProgress[0]!;
    out.push({
      id: `goal-${g.id}`, kind: "goal_pace", severity: "info",
      name: g.name, amount: Math.round(g.current), amount2: Math.round(g.target),
      pct: Math.round((g.current / g.target) * 100), count: proj.monthsToGo ?? undefined,
      action: { label: "Add to goal", href: "/savings" },
    });
  }

  // 12) Spare money this month worth moving to savings.
  const surplus = incomeAvg - forecastSpend;
  if (!cashflowFlagged && incomeAvg > 0 && surplus >= Math.max(1, incomeAvg * 0.05)) {
    out.push({
      id: "surplus", kind: "save_surplus", severity: "opportunity",
      amount: Math.round(surplus), name: inProgress[0]?.g.name,
      action: { label: goals.length ? "Add to savings" : "Start saving", href: "/savings" },
    });
  }

  // 13) Expenses but no recent income — the numbers can't be complete.
  const recentIncome = txns.some((t) => t.type === "income" && ymIndex(t.date) >= ymIndex(now) - 1);
  if (hasExpenses && !recentIncome) {
    out.push({
      id: "add-income", kind: "add_income", severity: "info",
      action: { label: "Add income", href: "/transactions" },
    });
  }

  // 14) Positive reinforcement (kept to one, so the list stays action-first).
  if (incomeThisMonth > 0 && (incomeThisMonth - expenseThisMonth) / incomeThisMonth >= 0.2) {
    out.push({
      id: "healthy", kind: "healthy_savings", severity: "good",
      pct: Math.round(((incomeThisMonth - expenseThisMonth) / incomeThisMonth) * 100),
      amount: Math.round(incomeThisMonth - expenseThisMonth),
      action: { label: "See analytics", href: "/analytics" },
    });
  } else if (cmp.vsLastPct !== null && cmp.vsLastPct <= -10) {
    out.push({
      id: "down", kind: "spending_down", severity: "good",
      pct: Math.abs(cmp.vsLastPct), action: { label: "See analytics", href: "/analytics" },
    });
  }

  // Rank: most urgent first, then by the money at stake. Keep only one "good".
  out.sort((a, b) => {
    const w = SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity];
    if (w !== 0) return w;
    return (b.amount ?? 0) - (a.amount ?? 0);
  });

  const max = input.max ?? 5;
  const picked: Suggestion[] = [];
  let goodCount = 0;
  for (const s of out) {
    if (s.severity === "good") {
      if (goodCount >= 1) continue;
      goodCount += 1;
    }
    picked.push(s);
    if (picked.length >= max) break;
  }
  return picked;
}
