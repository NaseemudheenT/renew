import { describe, it, expect } from "vitest";
import { parseMoneyCommand, parseRenAction } from "./ren";

describe("ren.parseRenAction", () => {
  it("switches to dark / light mode on request", () => {
    expect(parseRenAction("switch to dark mode")).toMatchObject({ kind: "theme", theme: "dark" });
    expect(parseRenAction("change to light theme")).toMatchObject({ kind: "theme", theme: "light" });
    expect(parseRenAction("go dark")).toMatchObject({ kind: "theme", theme: "dark" });
  });
  it("toggles when no direction is given", () => {
    expect(parseRenAction("change the theme")).toMatchObject({ kind: "theme", theme: "toggle" });
  });
  it("navigates to a section on an explicit open/go verb", () => {
    expect(parseRenAction("open my budgets")).toMatchObject({ kind: "navigate", href: "/budget" });
    expect(parseRenAction("go to settings")).toMatchObject({ kind: "navigate", href: "/settings" });
    expect(parseRenAction("take me to transactions")).toMatchObject({ kind: "navigate", href: "/transactions" });
  });
  it("does NOT hijack questions or money commands", () => {
    expect(parseRenAction("how much did I spend on bills?")).toBeNull();
    expect(parseRenAction("spent 500 on groceries")).toBeNull();
    expect(parseRenAction("what's my net worth?")).toBeNull();
  });
});

describe("ren.parseMoneyCommand", () => {
  it("parses a spend command", () => {
    const d = parseMoneyCommand("spent 500 on groceries");
    expect(d).toMatchObject({ type: "expense", amount: 500, category: "groceries" });
  });

  it("parses income", () => {
    const d = parseMoneyCommand("got 50000 salary");
    expect(d).toMatchObject({ type: "income", amount: 50000 });
    expect(d!.category).toBe("salary");
  });

  it("handles a bare 'amount merchant' as an expense", () => {
    const d = parseMoneyCommand("500 netflix");
    expect(d).toMatchObject({ type: "expense", amount: 500, category: "entertainment" });
  });

  it("understands k / lakh shorthand", () => {
    expect(parseMoneyCommand("paid 2k rent")).toMatchObject({ type: "expense", amount: 2000 });
    expect(parseMoneyCommand("received 1 lakh bonus")).toMatchObject({ type: "income", amount: 100000 });
  });

  it("returns null for questions", () => {
    expect(parseMoneyCommand("how much did I spend this month?")).toBeNull();
    expect(parseMoneyCommand("can I afford 5000")).toBeNull();
    expect(parseMoneyCommand("what is my net worth")).toBeNull();
  });

  it("returns null when there is no amount", () => {
    expect(parseMoneyCommand("groceries")).toBeNull();
    expect(parseMoneyCommand("")).toBeNull();
  });

  it("strips filler words from the note", () => {
    const d = parseMoneyCommand("spent 250 on coffee at cafe");
    expect(d!.note.toLowerCase()).toContain("coffee");
    expect(d!.note.toLowerCase()).not.toContain("spent");
  });
});
