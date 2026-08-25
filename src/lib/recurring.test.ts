import { describe, it, expect } from "vitest";
import { detectRecurring, recurringKey, matchesTracked } from "@/lib/recurring";
import type { Transaction } from "@/lib/types";

const DAY = 86_400_000;
const BASE = Date.UTC(2026, 0, 1); // fixed "now" reference for deterministic tests
const NOW = BASE + 200 * DAY;

function tx(over: Partial<Transaction>): Transaction {
  return {
    id: Math.random().toString(36).slice(2),
    type: "expense",
    amount: 10,
    currency: "USD",
    category: "subscriptions",
    date: BASE,
    createdAt: BASE,
    updatedAt: BASE,
    ...over,
  };
}

/** N monthly occurrences (~30 days apart) ending `endOffsetDays` before NOW. */
function monthly(note: string, amount: number, count: number, endOffsetDays = 5): Transaction[] {
  const out: Transaction[] = [];
  for (let i = 0; i < count; i++) {
    out.push(tx({ note, amount, date: NOW - endOffsetDays * DAY - (count - 1 - i) * 30 * DAY }));
  }
  return out;
}

describe("recurringKey", () => {
  it("strips digits/punctuation so variants group together", () => {
    expect(recurringKey({ note: "NETFLIX 12/03", category: "x", type: "expense" }))
      .toBe(recurringKey({ note: "Netflix", category: "x", type: "expense" }));
  });
  it("falls back to category when there's no note", () => {
    expect(recurringKey({ note: "", category: "rent", type: "expense" })).toBe("expense:cat:rent");
  });
});

describe("detectRecurring", () => {
  it("detects a steady monthly subscription", () => {
    const res = detectRecurring(monthly("Netflix", 15.99, 4), { now: NOW });
    expect(res).toHaveLength(1);
    expect(res[0]!.name).toBe("Netflix");
    expect(res[0]!.cycle).toBe("monthly");
    expect(res[0]!.amount).toBeCloseTo(15.99, 2);
    expect(res[0]!.occurrences).toBe(4);
    expect(res[0]!.nextAt).toBeGreaterThan(NOW - 30 * DAY);
  });

  it("ignores groups with too few occurrences", () => {
    expect(detectRecurring(monthly("Gym", 20, 2), { now: NOW })).toHaveLength(0);
  });

  it("rejects irregular cadence", () => {
    const irregular = [
      tx({ note: "Coffee", amount: 5, date: NOW - 90 * DAY }),
      tx({ note: "Coffee", amount: 5, date: NOW - 75 * DAY }), // 15d
      tx({ note: "Coffee", amount: 5, date: NOW - 10 * DAY }), // 65d
    ];
    expect(detectRecurring(irregular, { now: NOW })).toHaveLength(0);
  });

  it("rejects wildly varying amounts", () => {
    const varying = [
      tx({ note: "Shopping", amount: 10, date: NOW - 65 * DAY }),
      tx({ note: "Shopping", amount: 90, date: NOW - 35 * DAY }),
      tx({ note: "Shopping", amount: 40, date: NOW - 5 * DAY }),
    ];
    expect(detectRecurring(varying, { now: NOW })).toHaveLength(0);
  });

  it("skips patterns that have clearly stopped", () => {
    // 4 monthly, but last one ~120 days ago (> 1.6 months)
    const stopped = monthly("Old sub", 9.99, 4, 120);
    expect(detectRecurring(stopped, { now: NOW })).toHaveLength(0);
  });

  it("ranks the biggest monthly cost first", () => {
    const res = detectRecurring([...monthly("Cheap", 5, 4), ...monthly("Pricey", 50, 4)], { now: NOW });
    expect(res[0]!.name).toBe("Pricey");
  });
});

describe("matchesTracked", () => {
  it("matches an already-tracked subscription by name + amount", () => {
    const [cand] = detectRecurring(monthly("Netflix", 15.99, 4), { now: NOW });
    expect(matchesTracked(cand!, [{ name: "Netflix", price: 15.99 }])).toBe(true);
    expect(matchesTracked(cand!, [{ name: "Spotify", price: 9.99 }])).toBe(false);
  });
});
