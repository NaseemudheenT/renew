import { describe, it, expect } from "vitest";
import { toCSV, fileDateStamp } from "@/lib/export";

describe("toCSV", () => {
  it("returns empty string for no rows", () => {
    expect(toCSV([])).toBe("");
  });
  it("uses the union of keys as the header", () => {
    const csv = toCSV([{ a: 1, b: 2 }, { a: 3, c: 4 }]);
    const [header] = csv.split("\n");
    expect(header).toBe("a,b,c");
  });
  it("escapes commas, quotes and newlines per RFC 4180", () => {
    const csv = toCSV([{ note: 'a,b "c"\nd' }]);
    expect(csv.split("\n")[0]).toBe("note");
    expect(csv).toContain('"a,b ""c""');
  });
  it("renders null/undefined as empty fields", () => {
    const csv = toCSV([{ a: null, b: undefined, c: 0 }]);
    expect(csv.split("\n")[1]).toBe(",,0");
  });
});

describe("fileDateStamp", () => {
  it("formats yyyy-mm-dd", () => {
    expect(fileDateStamp(new Date(Date.UTC(2026, 7, 17)))).toBe("2026-08-17");
  });
});
