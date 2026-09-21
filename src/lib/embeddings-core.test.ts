import { describe, it, expect } from "vitest";
import { cosineSimilarity, categoryDocs } from "./embeddings-core";

describe("cosineSimilarity", () => {
  it("is 1 for identical vectors", () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 6);
    expect(cosineSimilarity([0.2, 0.9], [0.4, 1.8])).toBeCloseTo(1, 6); // same direction
  });
  it("is 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 6);
  });
  it("is negative for opposite vectors", () => {
    expect(cosineSimilarity([1, 1], [-1, -1])).toBeCloseTo(-1, 6);
  });
  it("returns 0 (never throws) for empty, zero, or mismatched vectors", () => {
    expect(cosineSimilarity([], [])).toBe(0);
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
    expect(cosineSimilarity([1, 2, 3], [1, 2])).toBe(0);
  });
});

describe("categoryDocs", () => {
  it("builds a document (name + subcategories) per category", () => {
    const exp = categoryDocs("expense");
    expect(exp.length).toBeGreaterThan(10);
    const food = exp.find((d) => d.id === "food");
    expect(food).toBeTruthy();
    expect(food!.text.toLowerCase()).toContain("food");
    expect(food!.text.toLowerCase()).toContain("restaurant"); // a subcategory
  });
  it("uses income categories for income", () => {
    const inc = categoryDocs("income");
    expect(inc.some((d) => d.id === "salary")).toBe(true);
    expect(inc.some((d) => d.id === "food")).toBe(false);
  });
});
