import { describe, it, expect } from "vitest";
import { answerQuestion, type AskContext } from "@/lib/ask";
import type { Transaction, TxType } from "@/lib/types";

const NOW = new Date(2026, 7, 15).getTime(); // 15 Aug 2026
const thisMonth = new Date(2026, 7, 5).getTime();
const lastMonth = new Date(2026, 6, 5).getTime();

function tx(type: TxType, amount: number, category: string, date: number): Transaction {
  return { id: `${type}-${amount}-${date}-${Math.random()}`, type, amount, currency: "INR", category, date, createdAt: date, updatedAt: date };
}

const ctx: AskContext = {
  transactions: [
    tx("income", 5000, "salary", thisMonth),
    tx("expense", 300, "food", thisMonth),
    tx("expense", 200, "food", thisMonth),
    tx("expense", 1000, "rent", thisMonth),
    tx("expense", 400, "food", lastMonth),
  ],
  netWorth: 12345,
  monthlySubs: 750,
  activeSubs: 3,
  currency: "INR",
  now: NOW,
};

describe("answerQuestion", () => {
  it("totals spending this month", () => {
    expect(answerQuestion("how much did I spend this month?", ctx)?.value).toBe(1500);
  });
  it("filters spending by category", () => {
    expect(answerQuestion("how much did I spend on food?", ctx)?.value).toBe(500);
  });
  it("understands last month", () => {
    expect(answerQuestion("how much on food last month?", ctx)?.value).toBe(400);
  });
  it("answers income", () => {
    expect(answerQuestion("what did I earn this month?", ctx)?.value).toBe(5000);
  });
  it("finds the biggest expense", () => {
    const a = answerQuestion("what's my biggest expense?", ctx);
    expect(a?.value).toBe(1000);
    expect(a?.detail).toBe("Rent & Home");
  });
  it("answers subscriptions cost", () => {
    expect(answerQuestion("how much are my subscriptions?", ctx)?.value).toBe(750);
  });
  it("answers net worth", () => {
    expect(answerQuestion("what's my net worth?", ctx)?.value).toBe(12345);
  });
  it("returns null when it can't understand", () => {
    expect(answerQuestion("what is the meaning of life", ctx)).toBeNull();
  });
});
