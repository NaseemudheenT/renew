import { describe, it, expect } from "vitest";
import { isPremium, PERKS, PREMIUM_PERKS, DEFAULT_PLAN } from "./plan";

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
});
