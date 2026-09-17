import { describe, it, expect } from "vitest";
import { editDistance, fuzzyRatio, merchantKey, categorize } from "./categorize";

describe("editDistance / fuzzyRatio (§6)", () => {
  it("measures edit distance", () => {
    expect(editDistance("swiggy", "swiggy")).toBe(0);
    expect(editDistance("swiggy", "swigy")).toBe(1);
    expect(editDistance("", "abc")).toBe(3);
  });
  it("rates messy OCR/SMS text against a clean merchant", () => {
    // "swiggy bangalore" vs "swiggy" — similar prefix, ratio should be moderate
    expect(fuzzyRatio("swiggy", "swiggy")).toBe(1);
    expect(fuzzyRatio("swigy", "swiggy")).toBeGreaterThanOrEqual(0.8);
    expect(fuzzyRatio("zzzz", "swiggy")).toBeLessThan(0.5);
  });
});

describe("merchantKey", () => {
  it("normalises to a safe, stable key", () => {
    expect(merchantKey("SWIGGY*BANGALORE")).toBe("swiggy bangalore");
    expect(merchantKey("  Coffee@Starbucks  ")).toBe("coffee starbucks");
    expect(merchantKey("")).toBe("");
  });
});

describe("categorize (§2 scoring)", () => {
  it("keyword-only match suggests a category", () => {
    const g = categorize("Uber ride home", "expense");
    expect(g.category).toBe("transport");
    expect(g.source).toBe("keyword");
    // one keyword hit = 15 → below 40 → ask; strong multi-hit merchants score higher
    expect(g.score).toBeGreaterThan(0);
  });

  it("a learned merchant becomes an exact, auto-confident match", () => {
    const learned = { "my corner cafe": "food" };
    const g = categorize("My Corner Cafe", "expense", learned);
    expect(g.category).toBe("food");
    expect(g.confidence).toBe("auto"); // 100 + 50 >= 80
    expect(g.source).toBe("learned");
  });

  it("fuzzy-matches messy text to a learned merchant (§6)", () => {
    const learned = { "swiggy bangalore": "food" };
    const g = categorize("SWIGGY BANGALOR", "expense", learned); // 1 char off
    expect(g.category).toBe("food");
    expect(g.source).toBe("learned");
  });

  it("empty text asks", () => {
    const g = categorize("", "expense");
    expect(g.confidence).toBe("ask");
    expect(g.category).toBe("other_expense");
  });

  it("income keeps income categories", () => {
    expect(categorize("March salary", "income").category).toBe("salary");
  });
});
