import { describe, it, expect } from "vitest";
import {
  categoriesFor,
  catMeta,
  resolveCatMeta,
  customCatMeta,
  makeCustomCategoryId,
  investmentMeta,
  monthRange,
  monthPaceProjection,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
} from "@/lib/finance";
import type { CustomCategory } from "@/lib/types";

describe("monthPaceProjection", () => {
  it("projects the month total from the current daily pace", () => {
    // 15 Aug (day 15 of 31): 1500 spent → 1500/15*31 = 3100
    const now = new Date(2026, 7, 15).getTime();
    expect(monthPaceProjection(1500, now)).toBe(3100);
  });
  it("equals the amount spent on the last day of the month", () => {
    const now = new Date(2026, 7, 31).getTime(); // day 31 of 31
    expect(monthPaceProjection(2000, now)).toBe(2000);
  });
});

describe("categoriesFor", () => {
  it("returns income vs expense sets", () => {
    expect(categoriesFor("income")).toBe(INCOME_CATEGORIES);
    expect(categoriesFor("expense")).toBe(EXPENSE_CATEGORIES);
  });
});

describe("catMeta", () => {
  it("resolves a known built-in id", () => {
    expect(catMeta("food").label).toBe("Food & Drink");
  });
  it("falls back gracefully for unknown ids", () => {
    const meta = catMeta("does-not-exist");
    expect(meta.label).toBe("Other");
    expect(meta.id).toBe("does-not-exist");
  });
});

describe("resolveCatMeta", () => {
  const custom: CustomCategory[] = [
    { id: "custom_expense_gym_ab12x", label: "Gym", type: "expense" },
  ];
  it("prefers built-in categories", () => {
    expect(resolveCatMeta("salary", custom).label).toBe("Salary");
  });
  it("resolves a custom category by id", () => {
    expect(resolveCatMeta("custom_expense_gym_ab12x", custom).label).toBe("Gym");
  });
  it("falls back to Other for unknown ids", () => {
    expect(resolveCatMeta("mystery", custom).label).toBe("Other");
  });
});

describe("customCatMeta", () => {
  it("tones income green and expense rose", () => {
    expect(customCatMeta({ id: "a", label: "A", type: "income" }).tone).toContain("emerald");
    expect(customCatMeta({ id: "b", label: "B", type: "expense" }).tone).toContain("rose");
  });
});

describe("makeCustomCategoryId", () => {
  it("produces a namespaced, slugged, unique id", () => {
    const id = makeCustomCategoryId("Coffee & Snacks", "expense");
    expect(id.startsWith("custom_expense_coffee-snacks_")).toBe(true);
  });
  it("handles labels with no alphanumerics", () => {
    expect(makeCustomCategoryId("!!!", "income").startsWith("custom_income_cat_")).toBe(true);
  });
  it("is unique across calls", () => {
    expect(makeCustomCategoryId("X", "income")).not.toBe(makeCustomCategoryId("X", "income"));
  });
});

describe("investmentMeta", () => {
  it("maps a known type", () => {
    expect(investmentMeta("crypto").label).toBe("Crypto");
  });
  it("falls back to Other", () => {
    // @ts-expect-error deliberately passing an unknown type
    expect(investmentMeta("unknown").label).toBe("Other");
  });
});

describe("monthRange", () => {
  it("spans the calendar month of the reference date", () => {
    const { start, end } = monthRange(new Date(2026, 5, 15)); // June 2026
    expect(new Date(start).getMonth()).toBe(5);
    expect(new Date(start).getDate()).toBe(1);
    expect(new Date(end).getMonth()).toBe(6); // exclusive upper bound = 1 Jul
    expect(new Date(end).getDate()).toBe(1);
  });
});
