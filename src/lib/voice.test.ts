import { describe, it, expect } from "vitest";
import { parseSpokenTransaction } from "./voice";

describe("parseSpokenTransaction", () => {
  it("parses a spelled-out expense with category", () => {
    const p = parseSpokenTransaction("spent five hundred on groceries");
    expect(p.type).toBe("expense");
    expect(p.amount).toBe(500);
    expect(p.category).toBe("groceries");
  });

  it("detects income and salary", () => {
    const p = parseSpokenTransaction("received 20000 salary");
    expect(p.type).toBe("income");
    expect(p.amount).toBe(20000);
    expect(p.category).toBe("salary");
  });

  it("parses digits with a rent category", () => {
    const p = parseSpokenTransaction("paid 1200 for rent");
    expect(p.type).toBe("expense");
    expect(p.amount).toBe(1200);
    expect(p.category).toBe("rent");
  });

  it("scales thousand/lakh multipliers", () => {
    expect(parseSpokenTransaction("2 thousand on shopping").amount).toBe(2000);
    expect(parseSpokenTransaction("1 lakh salary").amount).toBe(100000);
  });

  it("returns null amount when none is spoken", () => {
    const p = parseSpokenTransaction("bought coffee");
    expect(p.amount).toBeNull();
    expect(p.category).toBe("food");
    expect(p.type).toBe("expense");
  });

  it("extracts a readable note after on/for", () => {
    const p = parseSpokenTransaction("spent 300 on movie tickets");
    expect(p.note.toLowerCase()).toContain("movie tickets");
    expect(p.category).toBe("entertainment");
  });
});
