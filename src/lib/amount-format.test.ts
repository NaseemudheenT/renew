import { describe, it, expect } from "vitest";
import { formatAmountTyping, parseAmount, groupingLocale, displayFromValue } from "./amount-format";

describe("amount-format", () => {
  it("groups Indian-style (lakh) for India", () => {
    expect(formatAmountTyping("100000", "en-IN").display).toBe("1,00,000");
    expect(formatAmountTyping("10000000", "en-IN").display).toBe("1,00,00,000");
  });

  it("groups Western-style (thousands) elsewhere", () => {
    expect(formatAmountTyping("100000", "en-US").display).toBe("100,000");
    expect(formatAmountTyping("1000000", "en-US").display).toBe("1,000,000");
  });

  it("keeps a decimal and caps it at two places", () => {
    expect(formatAmountTyping("1234.5", "en-US").display).toBe("1,234.5");
    expect(formatAmountTyping("1234.567", "en-US").display).toBe("1,234.56");
  });

  it("ignores junk and preserves the numeric value", () => {
    const r = formatAmountTyping("1a2b3c4d5", "en-IN");
    expect(r.display).toBe("12,345");
    expect(r.value).toBe(12345);
  });

  it("round-trips display -> value", () => {
    expect(parseAmount("1,00,000")).toBe(100000);
    expect(parseAmount("1,234.56")).toBe(1234.56);
    expect(parseAmount("")).toBe(0);
  });

  it("preserves a leading minus (e.g. overdraft opening balance)", () => {
    expect(formatAmountTyping("-5000", "en-US").display).toBe("-5,000");
    expect(formatAmountTyping("-5000", "en-US").value).toBe(-5000);
    expect(parseAmount("-1,00,000")).toBe(-100000);
    expect(displayFromValue(-5000, "en-US")).toBe("-5,000");
  });

  it("picks the grouping locale from region/currency", () => {
    expect(groupingLocale("IN")).toBe("en-IN");
    expect(groupingLocale(undefined, "INR")).toBe("en-IN");
    expect(groupingLocale("US", "USD")).toBe("en-US");
  });

  it("seeds an empty string for zero/undefined", () => {
    expect(displayFromValue(0, "en-IN")).toBe("");
    expect(displayFromValue(undefined, "en-IN")).toBe("");
    expect(displayFromValue(100000, "en-IN")).toBe("1,00,000");
  });
});
