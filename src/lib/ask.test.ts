import { describe, it, expect } from "vitest";
import { answerQuestion, parseAmountInQuestion, type AskContext } from "@/lib/ask";
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
  it("projects month-end spending from the current pace", () => {
    // 1500 spent by day 15 → ~100/day; ~16 days left → +~1600; deterministic.
    const a = answerQuestion("am I on track this month?", ctx);
    expect(a?.title).toBe("Projected spending this month");
    expect(a?.value).toBeGreaterThan(1500); // more than spent-so-far
  });

  it("compares this month vs last month spending", () => {
    // this month expenses = 1500, last month = 400
    const a = answerQuestion("am I spending more than last month?", ctx);
    expect(a?.title).toBe("Spending vs last month");
    expect(a?.value).toBe(1500);
    expect(a?.detail).toContain("more than last month");
  });

  it("computes average spend per day this month", () => {
    // 1500 over 15 days = 100/day
    expect(answerQuestion("what's my average spend per day?", ctx)?.value).toBe(100);
  });

  it("tells how much is left to spend this month", () => {
    // income 5000 − expenses 1500 = 3500
    const a = answerQuestion("how much can I spend this month?", ctx);
    expect(a?.title).toBe("Left to spend this month");
    expect(a?.value).toBe(3500);
  });

  it("says yes when something is affordable this month", () => {
    const a = answerQuestion("can I afford 2000?", ctx);
    expect(a?.title).toBe("Yes — that fits this month");
    expect(a?.value).toBe(1500); // 3500 − 2000
  });

  it("says no when it exceeds what's left", () => {
    const a = answerQuestion("can I afford 5000?", ctx);
    expect(a?.title).toBe("That's more than you have left");
    expect(a?.value).toBe(-1500); // 3500 − 5000
  });

  it("subtracts bills still due from what's affordable", () => {
    const a = answerQuestion("can I afford 2000?", { ...ctx, upcomingBillsTotal: 1000 });
    expect(a?.value).toBe(500); // (3500 − 1000 bills) − 2000
  });

  it("returns null when it can't understand", () => {
    expect(answerQuestion("what is the meaning of life", ctx)).toBeNull();
  });
});

describe("parseAmountInQuestion", () => {
  it("reads plain and comma-grouped numbers", () => {
    expect(parseAmountInQuestion("can i afford 2000")).toBe(2000);
    expect(parseAmountInQuestion("afford 1,25,000 rupees")).toBe(125000);
  });
  it("expands k and lakh suffixes", () => {
    expect(parseAmountInQuestion("afford 2.5k")).toBe(2500);
    expect(parseAmountInQuestion("afford 3 lakh")).toBe(300000);
  });
  it("returns null with no number", () => {
    expect(parseAmountInQuestion("can i afford it")).toBeNull();
  });
});
