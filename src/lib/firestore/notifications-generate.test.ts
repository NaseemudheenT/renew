import { describe, it, expect } from "vitest";
import { computeDesired } from "@/lib/firestore/notifications-generate";
import { monthRange } from "@/lib/finance";
import type { Budget, SavingsGoal, Transaction } from "@/lib/types";

const empty = { reminders: [], tasks: [], payments: [], documents: [] };
const allPrefs = {
  reminders: true, tasks: true, payments: true,
  documents: true, budgets: true, savings: true,
};

function tx(category: string, amount: number, currency = "USD"): Transaction {
  const mid = (monthRange().start + monthRange().end) / 2;
  return { id: Math.random().toString(), type: "expense", amount, currency, category, date: mid, createdAt: mid, updatedAt: mid };
}

describe("computeDesired — budgets", () => {
  const budgets: Budget[] = [{ id: "b1", category: "food", amount: 100, currency: "USD", createdAt: 0, updatedAt: 0 }];

  it("warns at ≥90% of the limit", () => {
    const out = computeDesired({ ...empty, budgets, transactions: [tx("food", 95)] }, allPrefs);
    expect(out.some((d) => d.type === "budget" && d.title === "Budget almost reached")).toBe(true);
  });
  it("flags an exceeded budget", () => {
    const out = computeDesired({ ...empty, budgets, transactions: [tx("food", 130)] }, allPrefs);
    expect(out.some((d) => d.title === "Budget exceeded")).toBe(true);
  });
  it("stays quiet below 90%", () => {
    const out = computeDesired({ ...empty, budgets, transactions: [tx("food", 50)] }, allPrefs);
    expect(out.some((d) => d.type === "budget")).toBe(false);
  });
  it("respects the budgets pref being off", () => {
    const out = computeDesired({ ...empty, budgets, transactions: [tx("food", 130)] }, { ...allPrefs, budgets: false });
    expect(out.some((d) => d.type === "budget")).toBe(false);
  });
  it("does not sum other-currency spend against a budget", () => {
    // 60 USD + 50 EUR on 'food'; a 100 USD budget must see only 60 USD.
    const out = computeDesired(
      { ...empty, budgets, transactions: [tx("food", 60, "USD"), tx("food", 50, "EUR")] },
      allPrefs,
    );
    expect(out.some((d) => d.type === "budget")).toBe(false);
  });
  it("labels a custom-category budget with its real name", () => {
    const customBudgets: Budget[] = [{ id: "bc", category: "custom_expense_gym_ab12x", amount: 100, currency: "USD", createdAt: 0, updatedAt: 0 }];
    const out = computeDesired(
      {
        ...empty,
        budgets: customBudgets,
        transactions: [tx("custom_expense_gym_ab12x", 130)],
        customCategories: [{ id: "custom_expense_gym_ab12x", label: "Gym", type: "expense" }],
      },
      allPrefs,
    );
    expect(out.find((d) => d.type === "budget")?.body).toContain("Gym");
  });
  it("localizes titles/bodies to the given language", () => {
    const out = computeDesired({ ...empty, budgets, transactions: [tx("food", 130)] }, allPrefs, "es");
    const hit = out.find((d) => d.type === "budget");
    expect(hit?.title).toBe("Presupuesto superado");
    expect(hit?.body).toContain("Food & Drink");
  });
});

describe("computeDesired — savings", () => {
  const reached: SavingsGoal[] = [{ id: "s1", name: "Trip", target: 1000, current: 1000, currency: "USD", createdAt: 0, updatedAt: 0 }];
  const partial: SavingsGoal[] = [{ id: "s2", name: "Car", target: 1000, current: 400, currency: "USD", createdAt: 0, updatedAt: 0 }];

  it("notifies when a goal is reached", () => {
    const out = computeDesired({ ...empty, savings: reached }, allPrefs);
    expect(out.some((d) => d.type === "savings" && d.sourceId === "s1")).toBe(true);
  });
  it("stays quiet for a partial goal", () => {
    const out = computeDesired({ ...empty, savings: partial }, allPrefs);
    expect(out.some((d) => d.type === "savings")).toBe(false);
  });
});
