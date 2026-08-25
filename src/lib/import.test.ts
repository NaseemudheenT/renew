import { describe, it, expect } from "vitest";
import { parseCSV, rowsToTransactions, guessCategory, detectMapping, buildDrafts, parseStatement, parseReceipt } from "@/lib/import";
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

describe("guessCategory", () => {
  it("maps merchants to categories, deterministically", () => {
    expect(guessCategory("NETFLIX.COM", "expense")).toBe("entertainment");
    expect(guessCategory("UBER TRIP", "expense")).toBe("transport");
    expect(guessCategory("BIGBASKET", "expense")).toBe("groceries");
    expect(guessCategory("Salary Credit", "income")).toBe("salary");
    expect(guessCategory("random shop xyz", "expense")).toBe("other_expense");
  });
  it("recognises the expanded category set", () => {
    expect(guessCategory("HP Petrol Pump", "expense")).toBe("fuel");
    expect(guessCategory("Jio Recharge", "expense")).toBe("phone");
    expect(guessCategory("MakeMyTrip Flight", "expense")).toBe("travel");
    expect(guessCategory("Cult.fit membership", "expense")).toBe("fitness");
    expect(guessCategory("LIC premium", "expense")).toBe("insurance");
    expect(guessCategory("Nykaa salon", "expense")).toBe("personal_care");
    // Fuel wins over transport for petrol/diesel keywords (order matters).
    expect(guessCategory("Diesel refill", "expense")).toBe("fuel");
  });
});

describe("detectMapping + buildDrafts", () => {
  it("detects statement columns", () => {
    const m = detectMapping(["date", "narration", "debit", "credit", "balance"]);
    expect(m.date).toBe("date");
    expect(m.description).toBe("narration");
    expect(m.debit).toBe("debit");
    expect(m.credit).toBe("credit");
  });

  it("builds drafts from debit/credit and skips duplicates", () => {
    const rows = parseCSV("Date,Narration,Debit,Credit\n2026-08-01,UBER,120,\n2026-08-02,Salary,,50000\n,bad,,,");
    const m = detectMapping(Object.keys(rows[0]!));
    const drafts = buildDrafts(rows, m, [] as Transaction[], "INR");
    expect(drafts).toHaveLength(2);
    const uber = drafts.find((d: { note: string }) => d.note === "UBER")!;
    expect(uber.type).toBe("expense");
    expect(uber.amount).toBe(120);
    expect(uber.category).toBe("transport");
    const sal = drafts.find((d: { note: string }) => d.note === "Salary")!;
    expect(sal.type).toBe("income");
    expect(sal.amount).toBe(50000);
  });

  it("flags a row already present as a duplicate (not included by default)", () => {
    const rows = parseCSV("Date,Narration,Debit,Credit\n2026-08-01,UBER,120,");
    const m = detectMapping(Object.keys(rows[0]!));
    const first = buildDrafts(rows, m, [] as Transaction[], "INR");
    const existing = first.map((d: { type: string; amount: number; category: string; date: number; note: string }) => ({
      id: "x", type: d.type, amount: d.amount, currency: "INR", category: d.category,
      note: d.note, date: d.date, createdAt: 0, updatedAt: 0,
    })) as unknown as Transaction[];
    const second = buildDrafts(rows, m, existing, "INR");
    expect(second[0]!.duplicate).toBe(true);
    expect(second[0]!.include).toBe(false);
  });
});

describe("parseStatement (PDF/text)", () => {
  const sample = [
    "Statement of Account",
    "01/08/2026 UBER TRIP 120.00 DR 5,880.00",
    "02/08/2026 SALARY CREDIT 50,000.00 CR 55,880.00",
    "Closing Balance 55,880.00",
  ].join("\n");

  it("extracts transactions, normalising dd/mm dates and CR/DR type", () => {
    const rows = parseStatement(sample);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ date: "2026-08-01", amount: "120.00", type: "expense" });
    expect(rows[0]!.description).toContain("UBER");
    expect(rows[1]).toMatchObject({ date: "2026-08-02", amount: "50000.00", type: "income" });
  });

  it("takes the transaction amount, not the running balance", () => {
    const rows = parseStatement("10-08-2026 AMAZON 999.00 DR 4,881.00");
    expect(rows[0]!.amount).toBe("999.00");
  });

  it("feeds cleanly into buildDrafts", () => {
    const rows = parseStatement(sample);
    const map = detectMapping(Object.keys(rows[0]!));
    const drafts = buildDrafts(rows, map, [] as Transaction[], "INR");
    expect(drafts).toHaveLength(2);
    expect(drafts.find((d: { type: string }) => d.type === "income")!.amount).toBe(50000);
  });
});

describe("parseReceipt (photo/OCR text)", () => {
  const receipt = [
    "STARBUCKS COFFEE",
    "123 MG Road",
    "12/08/2026",
    "Latte           220.00",
    "Croissant       180.00",
    "Subtotal        400.00",
    "GST 5%           20.00",
    "TOTAL           420.00",
    "VISA ****1234",
  ].join("\n");

  it("reads the grand total (not the subtotal or tax) as an expense", () => {
    const rows = parseReceipt(receipt);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ amount: "420", type: "expense", date: "2026-08-12" });
  });

  it("picks up the merchant name from the top of the receipt", () => {
    expect(parseReceipt(receipt)[0]!.description).toContain("STARBUCKS");
  });

  it("falls back to the largest amount when no total label is present", () => {
    const rows = parseReceipt("Corner Store\nItem A 50.00\nItem B 130.00");
    expect(rows[0]!.amount).toBe("130");
  });

  it("defaults an undated receipt to today so it is never dropped", () => {
    const rows = parseReceipt("Kirana Store\nTotal 99.00");
    expect(rows[0]!.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const drafts = buildDrafts(rows, detectMapping(Object.keys(rows[0]!)), [] as Transaction[], "INR");
    expect(drafts).toHaveLength(1);
    expect(drafts[0]!.amount).toBe(99);
  });

  it("returns [] when there is no amount to read", () => {
    expect(parseReceipt("thank you\nplease visit again")).toEqual([]);
  });
});
