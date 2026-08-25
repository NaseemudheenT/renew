import { describe, it, expect } from "vitest";
import { computeInsights } from "@/lib/insights";
import type { Transaction, TxType } from "@/lib/types";

// A fixed "now" so month bounds are deterministic: 15 Aug 2026.
const NOW = new Date(2026, 7, 15).getTime();
const thisMonth = new Date(2026, 7, 10).getTime();
const lastMonth = new Date(2026, 6, 10).getTime();

function tx(type: TxType, amount: number, category: string, date: number): Transaction {
  return { id: `${type}-${amount}-${date}`, type, amount, currency: "INR", category, date, createdAt: date, updatedAt: date };
}

describe("computeInsights", () => {
  it("computes safe-to-spend = income − expense − upcoming bills", () => {
    const out = computeInsights({
      transactions: [tx("income", 1000, "salary", thisMonth), tx("expense", 300, "food", thisMonth)],
      recurringMonthly: 0,
      activeSubs: 0,
      upcomingBillsTotal: 200,
      now: NOW,
    });
    const safe = out.find((i) => i.kind === "safe");
    expect(safe?.amount).toBe(500); // 1000 - 300 - 200
  });

  it("finds the biggest expense category this month", () => {
    const out = computeInsights({
      transactions: [
        tx("income", 1000, "salary", thisMonth),
        tx("expense", 100, "food", thisMonth),
        tx("expense", 400, "rent", thisMonth),
      ],
      recurringMonthly: 0, activeSubs: 0, upcomingBillsTotal: 0, now: NOW,
    });
    const top = out.find((i) => i.kind === "top");
    expect(top?.category).toBe("rent");
    expect(top?.amount).toBe(400);
  });

  it("computes month-over-month trend and ignores last month's spend in this month's totals", () => {
    const out = computeInsights({
      transactions: [
        tx("income", 1000, "salary", thisMonth),
        tx("expense", 200, "food", thisMonth),
        tx("expense", 100, "food", lastMonth),
      ],
      recurringMonthly: 0, activeSubs: 0, upcomingBillsTotal: 0, now: NOW,
    });
    const trend = out.find((i) => i.kind === "trend");
    expect(trend?.pct).toBe(100); // 200 vs 100 last month = +100%
    const top = out.find((i) => i.kind === "top");
    expect(top?.amount).toBe(200); // last month's 100 excluded
  });

  it("flags a category that jumped vs last month", () => {
    const out = computeInsights({
      transactions: [
        tx("income", 5000, "salary", thisMonth),
        tx("expense", 2000, "food", thisMonth), // this month
        tx("expense", 1000, "food", lastMonth), // last month → +100%
      ],
      recurringMonthly: 0, activeSubs: 0, upcomingBillsTotal: 0, now: NOW,
    });
    const jump = out.find((i) => i.kind === "category_change");
    expect(jump?.category).toBe("food");
    expect(jump?.pct).toBe(100);
    expect(jump?.amount).toBe(2000);
  });

  it("does not flag a category jump without a prior-month baseline", () => {
    const out = computeInsights({
      transactions: [tx("expense", 2000, "food", thisMonth)],
      recurringMonthly: 0, activeSubs: 0, upcomingBillsTotal: 0, now: NOW,
    });
    expect(out.find((i) => i.kind === "category_change")).toBeUndefined();
  });

  it("surfaces recurring cost only when there are active subscriptions", () => {
    const withSubs = computeInsights({ transactions: [], recurringMonthly: 750, activeSubs: 3, upcomingBillsTotal: 0, now: NOW });
    expect(withSubs.find((i) => i.kind === "recurring")).toMatchObject({ amount: 750, count: 3 });
    const none = computeInsights({ transactions: [], recurringMonthly: 0, activeSubs: 0, upcomingBillsTotal: 0, now: NOW });
    expect(none.length).toBe(0);
  });

  it("returns at most four insights", () => {
    const out = computeInsights({
      transactions: [
        tx("income", 1000, "salary", thisMonth),
        tx("expense", 200, "food", thisMonth),
        tx("expense", 100, "food", lastMonth),
      ],
      recurringMonthly: 500, activeSubs: 2, upcomingBillsTotal: 0, now: NOW,
    });
    expect(out.length).toBeLessThanOrEqual(4);
  });
});
