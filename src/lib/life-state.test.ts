import { describe, it, expect } from "vitest";
import { computeLifeState } from "./life-state";

const base = { monthIncome: 0, monthExpense: 0, netWorth: 0, overdueCount: 0 };

describe("computeLifeState", () => {
  it("flags overdue bills as needing attention (highest priority)", () => {
    // Even with a great month, an overdue bill surfaces first.
    const s = computeLifeState({ monthIncome: 5000, monthExpense: 1000, netWorth: 9000, overdueCount: 2 });
    expect(s.key).toBe("attention");
    expect(s.blurb).toContain("2 bills");
  });

  it("flags negative net worth as needing attention", () => {
    const s = computeLifeState({ ...base, monthIncome: 100, monthExpense: 50, netWorth: -200 });
    expect(s.key).toBe("attention");
  });

  it("is 'quiet' when nothing is recorded this month", () => {
    const s = computeLifeState({ ...base, netWorth: 500 });
    expect(s.key).toBe("quiet");
    expect(s.savingsRate).toBeNull();
  });

  it("is 'tight' when spending exceeds income this month", () => {
    const s = computeLifeState({ monthIncome: 1000, monthExpense: 1400, netWorth: 300, overdueCount: 0 });
    expect(s.key).toBe("tight");
  });

  it("is 'thriving' when keeping >=20% of income", () => {
    const s = computeLifeState({ monthIncome: 1000, monthExpense: 700, netWorth: 5000, overdueCount: 0 });
    expect(s.key).toBe("thriving");
    expect(s.savingsRate).toBeCloseTo(0.3, 5);
  });

  it("is 'stable' when positive but keeping under 20%", () => {
    const s = computeLifeState({ monthIncome: 1000, monthExpense: 900, netWorth: 5000, overdueCount: 0 });
    expect(s.key).toBe("stable");
  });

  it("returns a hex tone and a non-empty blurb for every state", () => {
    const inputs = [
      { monthIncome: 0, monthExpense: 0, netWorth: 1, overdueCount: 0 },
      { monthIncome: 1000, monthExpense: 700, netWorth: 1, overdueCount: 0 },
      { monthIncome: 1000, monthExpense: 950, netWorth: 1, overdueCount: 0 },
      { monthIncome: 1000, monthExpense: 1200, netWorth: 1, overdueCount: 0 },
      { monthIncome: 0, monthExpense: 0, netWorth: -1, overdueCount: 0 },
    ];
    for (const i of inputs) {
      const s = computeLifeState(i);
      expect(s.tone).toMatch(/^#[0-9a-f]{6}$/i);
      expect(s.blurb.length).toBeGreaterThan(0);
    }
  });
});
