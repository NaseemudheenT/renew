import { describe, it, expect } from "vitest";
import {
  computeAccountBalance,
  subscriptionMonthly,
  subscriptionTotals,
  advanceBilling,
} from "@/lib/accounts";
import { validateTransfer, TransferError } from "@/lib/firestore/transfers";
import type { Account, Transaction, Transfer, Subscription } from "@/lib/types";

function acct(id: string, opening: number, currency = "USD"): Account {
  return { id, name: id, atype: "bank", currency, openingBalance: opening, status: "active", createdAt: 0, updatedAt: 0 };
}
function tx(accountId: string, type: "income" | "expense", amount: number, currency = "USD"): Transaction {
  return { id: Math.random().toString(), type, amount, currency, category: "x", date: 0, accountId, createdAt: 0, updatedAt: 0 };
}

describe("computeAccountBalance", () => {
  const a = acct("a", 100);
  it("adds income, subtracts expense on the account", () => {
    const bal = computeAccountBalance(a, [tx("a", "income", 50), tx("a", "expense", 30)], []);
    expect(bal).toBe(120);
  });
  it("ignores transactions on other accounts and other currencies", () => {
    const bal = computeAccountBalance(a, [tx("b", "income", 50), tx("a", "income", 20, "EUR")], []);
    expect(bal).toBe(100);
  });
  it("applies transfers in and out", () => {
    const transfers: Transfer[] = [
      { id: "t1", fromAccountId: "a", toAccountId: "b", amount: 40, currency: "USD", date: 0, createdAt: 0, updatedAt: 0 },
      { id: "t2", fromAccountId: "c", toAccountId: "a", amount: 15, currency: "USD", date: 0, createdAt: 0, updatedAt: 0 },
    ];
    expect(computeAccountBalance(a, [], transfers)).toBe(75); // 100 - 40 + 15
  });
});

describe("subscription totals", () => {
  const monthly: Subscription = { id: "m", name: "A", price: 10, currency: "USD", cycle: "monthly", nextBillingAt: 0, category: "x", status: "active", createdAt: 0, updatedAt: 0 };
  const yearly: Subscription = { ...monthly, id: "y", price: 120, cycle: "yearly" };
  it("normalizes any cycle to a monthly-equivalent cost", () => {
    expect(subscriptionMonthly(monthly)).toBeCloseTo(10);
    expect(subscriptionMonthly(yearly)).toBeCloseTo(10);
  });
  it("totals active same-currency subscriptions", () => {
    const t = subscriptionTotals([monthly, yearly, { ...monthly, id: "c", status: "cancelled" }], "USD");
    expect(t.monthly).toBeCloseTo(20);
    expect(t.annual).toBeCloseTo(240);
  });
});

describe("advanceBilling", () => {
  const base = new Date(2026, 0, 15).getTime();
  it("advances by cycle", () => {
    expect(new Date(advanceBilling(base, "weekly")).getDate()).toBe(22);
    expect(new Date(advanceBilling(base, "monthly")).getMonth()).toBe(1);
    expect(new Date(advanceBilling(base, "quarterly")).getMonth()).toBe(3);
    expect(new Date(advanceBilling(base, "yearly")).getFullYear()).toBe(2027);
  });
});

describe("validateTransfer", () => {
  it("rejects same-account transfers", () => {
    expect(() => validateTransfer({ fromAccountId: "a", toAccountId: "a", amount: 10, currency: "USD", date: 0 })).toThrow(TransferError);
  });
  it("rejects non-positive amounts", () => {
    expect(() => validateTransfer({ fromAccountId: "a", toAccountId: "b", amount: 0, currency: "USD", date: 0 })).toThrow(TransferError);
  });
  it("accepts a valid transfer", () => {
    expect(() => validateTransfer({ fromAccountId: "a", toAccountId: "b", amount: 10, currency: "USD", date: 0 })).not.toThrow();
  });
});
