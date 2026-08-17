import { describe, it, expect } from "vitest";
import { parseCSV, rowsToTransactions } from "@/lib/import";
import type { Transaction } from "@/lib/types";

describe("parseCSV", () => {
  it("parses headers and rows, lowercasing headers", () => {
    const rows = parseCSV("Type,Amount\nexpense,10\nincome,20");
    expect(rows).toEqual([
      { type: "expense", amount: "10" },
      { type: "income", amount: "20" },
    ]);
  });
  it("handles quoted fields with commas, quotes and newlines", () => {
    const rows = parseCSV('note,amount\n"a, ""b""\nc",5');
    expect(rows[0]?.note).toBe('a, "b"\nc');
    expect(rows[0]?.amount).toBe("5");
  });
  it("returns [] for empty input", () => {
    expect(parseCSV("")).toEqual([]);
  });
});

describe("rowsToTransactions", () => {
  const existing: Transaction[] = [];
  it("maps valid rows and defaults currency", () => {
    const rows = [{ type: "expense", amount: "12.5", category: "food", date: "1737000000000", note: "lunch" }];
    const out = rowsToTransactions(rows, existing, "USD");
    expect(out.valid).toHaveLength(1);
    expect(out.valid[0]).toMatchObject({ type: "expense", amount: 12.5, currency: "USD", category: "food" });
  });
  it("drops invalid rows (bad amount / date)", () => {
    const rows = [
      { amount: "0", date: "1737000000000" },
      { amount: "10", date: "not-a-date" },
    ];
    const out = rowsToTransactions(rows, existing, "USD");
    expect(out.valid).toHaveLength(0);
    expect(out.invalid).toBe(2);
  });
  it("skips duplicates of existing transactions", () => {
    const date = Date.UTC(2026, 0, 15, 10);
    const dupe: Transaction = {
      id: "x", type: "expense", amount: 30, currency: "USD", category: "food",
      note: "dinner", date, createdAt: date, updatedAt: date,
    };
    const rows = [{ type: "expense", amount: "30", category: "food", note: "dinner", date: String(date) }];
    const out = rowsToTransactions(rows, [dupe], "USD");
    expect(out.valid).toHaveLength(0);
    expect(out.duplicates).toBe(1);
  });
  it("infers category from type when missing", () => {
    const rows = [{ type: "income", amount: "100", date: "1737000000000" }];
    const out = rowsToTransactions(rows, existing, "EUR");
    expect(out.valid[0]?.category).toBe("other_income");
  });
});
