import { describe, it, expect } from "vitest";
import { suggestions } from "./advisor";
import type { Transaction, Payment, Budget, Subscription, SavingsGoal } from "@/lib/types";

// Fixed "now" = 15 June 2024 so all month math is deterministic.
const NOW = new Date(2024, 5, 15).getTime();
function at(monthsAgo: number, day = 10): number {
  return new Date(2024, 5 - monthsAgo, day).getTime();
}
let n = 0;
function tx(category: string, amount: number, monthsAgo: number, type: "expense" | "income" = "expense"): Transaction {
  n += 1;
  const d = at(monthsAgo);
  return { id: `t${n}`, type, amount, currency: "INR", category, date: d, createdAt: d, updatedAt: d };
}
function bill(name: string, amount: number, dueInDays: number, status: Payment["status"] = "upcoming"): Payment {
  n += 1;
  return { id: `b${n}`, name, amount, currency: "INR", dueAt: NOW + dueInDays * 86_400_000, status, category: "other", repeat: "monthly", createdAt: NOW, updatedAt: NOW };
}
function budget(category: string, amount: number): Budget {
  n += 1;
  return { id: `bg${n}`, category, amount, currency: "INR", createdAt: NOW, updatedAt: NOW };
}
function sub(name: string, price: number, renewInDays = 30): Subscription {
  n += 1;
  return { id: `s${n}`, name, price, currency: "INR", cycle: "monthly", nextBillingAt: NOW + renewInDays * 86_400_000, category: "other", status: "active", createdAt: NOW, updatedAt: NOW };
}
function goal(name: string, current: number, target: number): SavingsGoal {
  n += 1;
  return { id: `g${n}`, name, target, current, currency: "INR", createdAt: at(6), updatedAt: NOW };
}

// A baseline of steady income so income-aware rules have data.
const income = [tx("salary", 50_000, 1, "income"), tx("salary", 50_000, 2, "income"), tx("salary", 50_000, 3, "income"), tx("salary", 50_000, 0, "income")];

describe("advisor.suggestions", () => {
  it("returns nothing for an empty account", () => {
    expect(suggestions({ transactions: [], now: NOW })).toEqual([]);
  });

  it("puts an overdue bill first and marks it urgent", () => {
    const res = suggestions({
      transactions: [...income, tx("food", 2_000, 0)],
      bills: [bill("Rent", 15_000, -3, "overdue"), bill("Phone", 500, 20)],
      now: NOW,
    });
    expect(res[0]!.kind).toBe("overdue_bill");
    expect(res[0]!.severity).toBe("urgent");
    expect(res[0]!.amount).toBe(15_000);
    expect(res[0]!.count).toBe(1);
  });

  it("flags a bill due within three days", () => {
    const res = suggestions({
      transactions: income,
      bills: [bill("Electricity", 1_200, 2)],
      now: NOW,
    });
    expect(res.some((s) => s.kind === "bill_due_soon" && s.name === "Electricity" && s.days === 2)).toBe(true);
  });

  it("detects going over a budget", () => {
    const res = suggestions({
      transactions: [...income, tx("food", 9_000, 0)],
      budgets: [budget("food", 6_000)],
      now: NOW,
    });
    const ob = res.find((s) => s.kind === "over_budget");
    expect(ob).toBeTruthy();
    expect(ob!.category).toBe("food");
    expect(ob!.amount).toBe(9_000);
    expect(ob!.amount2).toBe(6_000);
    expect(ob!.pct).toBe(50);
  });

  it("suggests reviewing subscriptions when there are several", () => {
    const res = suggestions({
      transactions: income,
      subscriptions: [sub("Netflix", 500), sub("Spotify", 200), sub("iCloud", 100)],
      now: NOW,
    });
    const s = res.find((x) => x.kind === "subscription_review");
    expect(s).toBeTruthy();
    expect(s!.count).toBe(3);
    expect(s!.amount).toBe(800); // all monthly
    expect(s!.amount2).toBe(9_600); // annualised
  });

  it("warns when on pace to spend more than you earn", () => {
    // Half the month gone, already spent 40k against 50k average income →
    // pace ≈ 80k > income.
    const res = suggestions({
      transactions: [...income, tx("shopping", 40_000, 0)],
      now: NOW,
    });
    expect(res.some((s) => s.kind === "negative_cashflow" && s.severity === "urgent")).toBe(true);
  });

  it("uses the declared setup income when there's no income history yet", () => {
    // A brand-new account: no income transactions, but they told us ~50k/mo at
    // setup and have already spent 40k halfway through the month (pace ≈ 80k).
    const withDeclared = suggestions({
      transactions: [tx("shopping", 40_000, 0)],
      declaredMonthlyIncome: 50_000,
      now: NOW,
    });
    expect(withDeclared.some((s) => s.kind === "negative_cashflow")).toBe(true);
    // Without it there's no income baseline, so no cashflow warning can fire.
    const without = suggestions({ transactions: [tx("shopping", 40_000, 0)], now: NOW });
    expect(without.some((s) => s.kind === "negative_cashflow")).toBe(false);
  });

  it("prefers real income history over the declared setup figure", () => {
    // Real averaged income (50k) should win over a stale/low declared value (1k),
    // so no false cashflow alarm from the declared number.
    const res = suggestions({
      transactions: [...income, tx("food", 5_000, 0)],
      declaredMonthlyIncome: 1_000,
      now: NOW,
    });
    expect(res.some((s) => s.kind === "negative_cashflow")).toBe(false);
  });

  it("celebrates a reached savings goal", () => {
    const res = suggestions({
      transactions: income,
      goals: [goal("Emergency fund", 100_000, 100_000)],
      now: NOW,
    });
    expect(res.some((s) => s.kind === "goal_reached" && s.severity === "good")).toBe(true);
  });

  it("ranks urgent above opportunity above good, and respects max", () => {
    const res = suggestions({
      transactions: [...income, tx("food", 9_000, 0)],
      bills: [bill("Rent", 15_000, -1, "overdue")],
      subscriptions: [sub("A", 500), sub("B", 500), sub("C", 500)],
      budgets: [budget("food", 6_000)],
      goals: [goal("Trip", 20_000, 20_000)],
      now: NOW,
      max: 3,
    });
    expect(res.length).toBe(3);
    expect(res[0]!.severity).toBe("urgent");
    // good ones are deprioritised out of a small max full of urgent/opportunity
    expect(res.every((s) => s.severity !== "good")).toBe(true);
  });
});
