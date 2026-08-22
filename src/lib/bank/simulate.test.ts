import { describe, it, expect } from "vitest";
import { buildSyncPlan } from "./simulate";
import { institutionById } from "./banks";

const hdfc = institutionById("hdfc")!;
const now = Date.UTC(2026, 7, 22); // fixed day for determinism

describe("buildSyncPlan", () => {
  const plan = buildSyncPlan({ institution: hdfc, currency: "INR", now });

  it("creates one linked-style account plus a full history", () => {
    expect(plan.accounts).toHaveLength(1);
    expect(plan.accounts[0]!.institution).toBe("HDFC Bank");
    expect(plan.transactions.length).toBeGreaterThan(15);
    expect(plan.bills.length).toBeGreaterThan(0);
    expect(plan.subscriptions.length).toBeGreaterThan(0);
  });

  it("only uses positive amounts and known transaction categories", () => {
    const cats = new Set(["salary", "rent", "groceries", "food", "transport", "shopping", "bills"]);
    for (const t of plan.transactions) {
      expect(t.amount).toBeGreaterThan(0);
      expect(cats.has(t.category)).toBe(true);
      expect(["income", "expense"]).toContain(t.type);
    }
  });

  it("keeps every transaction within the last ~78 days", () => {
    for (const t of plan.transactions) {
      expect(t.date).toBeLessThanOrEqual(now);
      expect(t.date).toBeGreaterThanOrEqual(now - 80 * 86_400_000);
    }
  });

  it("schedules upcoming bills and renewals in the future", () => {
    for (const b of plan.bills) expect(b.dueAt).toBeGreaterThan(now);
    for (const s of plan.subscriptions) expect(s.nextBillingAt).toBeGreaterThan(now);
  });

  it("is deterministic for the same institution + day", () => {
    const again = buildSyncPlan({ institution: hdfc, currency: "INR", now });
    expect(again.transactions.length).toBe(plan.transactions.length);
    expect(again.accounts[0]!.openingBalance).toBe(plan.accounts[0]!.openingBalance);
  });

  it("scales to an unknown currency without breaking", () => {
    const p = buildSyncPlan({ institution: hdfc, currency: "XYZ", now });
    expect(p.accounts[0]!.openingBalance).toBeGreaterThan(0);
    expect(p.transactions.every((t) => t.currency === "XYZ")).toBe(true);
  });
});
