import { describe, it, expect } from "vitest";
import {
  isPremium, PERKS, PREMIUM_PERKS, DEFAULT_PLAN,
  planPricing, yearlySavingPct, formatPlanPrice, FREE_LIMITS,
  scanQuota, nextScanUsage, monthKey,
} from "./plan";

describe("plan", () => {
  it("defaults to free", () => {
    expect(DEFAULT_PLAN).toBe("free");
    expect(isPremium(undefined)).toBe(false);
    expect(isPremium(null)).toBe(false);
    expect(isPremium("free")).toBe(false);
    expect(isPremium("premium")).toBe(true);
  });

  it("premium perks are exactly the non-free perks", () => {
    expect(PREMIUM_PERKS.length).toBeGreaterThan(0);
    expect(PREMIUM_PERKS.every((p) => !p.free)).toBe(true);
    expect(PREMIUM_PERKS.length).toBe(PERKS.filter((p) => !p.free).length);
  });

  it("every free perk is live (we never advertise a free feature that doesn't work)", () => {
    for (const p of PERKS.filter((p) => p.free)) expect(p.live).toBe(true);
  });

  it("perk ids are unique", () => {
    const ids = PERKS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("prices by region, annual is a real discount", () => {
    expect(planPricing("INR").symbol).toBe("₹");
    expect(planPricing("EUR").symbol).toBe("€");
    expect(planPricing("GBP").currency).toBe("USD"); // fallback
    expect(planPricing(null).currency).toBe("USD");
    for (const c of ["INR", "USD", "EUR"]) {
      const p = planPricing(c);
      expect(p.yearly).toBeLessThan(p.monthly * 12); // annual saves money
      expect(yearlySavingPct(p)).toBeGreaterThan(0);
      expect(p.oneTimeReport).toBeGreaterThan(0);
    }
  });

  it("formats prices, trimming trailing .00", () => {
    expect(formatPlanPrice(planPricing("INR"), 199)).toBe("₹199");
    expect(formatPlanPrice(planPricing("USD"), 4.99)).toBe("$4.99");
  });

  it("premium has unlimited scans; free is capped per calendar month", () => {
    const now = Date.UTC(2026, 8, 16);
    expect(scanQuota(true, undefined, now).unlimited).toBe(true);
    const fresh = scanQuota(false, undefined, now);
    expect(fresh.limit).toBe(FREE_LIMITS.scansPerMonth);
    expect(fresh.remaining).toBe(FREE_LIMITS.scansPerMonth);
    const used = scanQuota(false, { month: monthKey(now), count: 12 }, now);
    expect(used.remaining).toBe(0);
    // A last-month count doesn't eat into this month's allowance.
    const lastMonth = scanQuota(false, { month: "2026-08", count: 12 }, now);
    expect(lastMonth.remaining).toBe(FREE_LIMITS.scansPerMonth);
  });

  it("nextScanUsage increments within a month and rolls over", () => {
    const now = Date.UTC(2026, 8, 16);
    expect(nextScanUsage(undefined, now)).toEqual({ month: "2026-09", count: 1 });
    expect(nextScanUsage({ month: "2026-09", count: 3 }, now)).toEqual({ month: "2026-09", count: 4 });
    expect(nextScanUsage({ month: "2026-08", count: 9 }, now)).toEqual({ month: "2026-09", count: 1 });
  });
});
