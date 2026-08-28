import { describe, it, expect } from "vitest";
import { categoryAverages, anomalies, monthComparison, essentialSplit, isEssential, smartInsights, monthEndForecast } from "./intelligence";
import type { Transaction } from "@/lib/types";

// Fixed "now" = 15 June 2024, so month math is deterministic.
const NOW = new Date(2024, 5, 15).getTime();
function at(monthsAgo: number, day = 10): number {
  return new Date(2024, 5 - monthsAgo, day).getTime();
}
let n = 0;
function tx(category: string, amount: number, monthsAgo: number, type: "expense" | "income" = "expense"): Transaction {
  n += 1;
  return { id: `t${n}`, type, amount, currency: "INR", category, date: at(monthsAgo), createdAt: at(monthsAgo), updatedAt: at(monthsAgo) };
}

describe("intelligence", () => {
  it("averages a category over the prior complete months (excluding current)", () => {
    const txns = [tx("food", 600, 1), tx("food", 900, 2), tx("food", 300, 3), tx("food", 9999, 0)];
    const avg = categoryAverages(txns, 3, NOW);
    expect(avg.get("food")).toBe((600 + 900 + 300) / 3); // 600; current month's 9999 excluded
  });

  it("flags anomalies above the average by the threshold", () => {
    // avg food over 3 prior months = 600; this month = 900 → +50%
    const txns = [tx("food", 600, 1), tx("food", 600, 2), tx("food", 600, 3), tx("food", 900, 0)];
    const a = anomalies(txns, NOW, { months: 3, minPct: 20 });
    expect(a).toHaveLength(1);
    expect(a[0]!.category).toBe("food");
    expect(a[0]!.pct).toBe(50);
    // No history → no anomaly even if this month has spend.
    expect(anomalies([tx("shopping", 5000, 0)], NOW)).toHaveLength(0);
  });

  it("compares this month vs last vs average", () => {
    const txns = [tx("food", 1000, 0), tx("food", 500, 1), tx("food", 700, 2), tx("food", 900, 3)];
    const c = monthComparison(txns, NOW, 3);
    expect(c.thisMonth).toBe(1000);
    expect(c.lastMonth).toBe(500);
    expect(c.average).toBe((500 + 700 + 900) / 3); // 700
    expect(c.vsLastPct).toBe(100); // 1000 vs 500
    expect(c.vsAvgPct).toBe(43); // (1000-700)/700 ≈ 42.8 → 43
  });

  it("splits essential vs discretionary for the current month", () => {
    const txns = [tx("groceries", 400, 0), tx("rent", 1000, 0), tx("entertainment", 300, 0), tx("shopping", 200, 0)];
    const s = essentialSplit(txns, NOW);
    expect(s.essential).toBe(1400); // groceries + rent
    expect(s.discretionary).toBe(500); // entertainment + shopping
  });

  it("classifies essential categories", () => {
    expect(isEssential("groceries")).toBe(true);
    expect(isEssential("rent")).toBe(true);
    expect(isEssential("entertainment")).toBe(false);
    expect(isEssential("shopping")).toBe(false);
  });

  it("projects month-end spend from the current pace", () => {
    // On day 15 of a 30-day month, ₹3,000 so far → ~₹6,000 projected.
    expect(monthEndForecast(3000, NOW)).toBe(6000);
  });

  it("produces ranked structured insights (no strings)", () => {
    const txns = [
      tx("food", 600, 1), tx("food", 600, 2), tx("food", 600, 3), tx("food", 1200, 0),
      tx("rent", 1000, 0),
    ];
    const ins = smartInsights(txns, NOW, 3);
    expect(ins.some((i) => i.kind === "anomaly" && i.category === "food")).toBe(true);
    expect(ins.some((i) => i.kind === "split")).toBe(true);
  });
});
