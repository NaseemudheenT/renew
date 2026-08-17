import { describe, it, expect } from "vitest";
import {
  formatMoney,
  formatMoneyPrecise,
  formatNumber,
  formatPercent,
  formatDate,
  formatRelative,
} from "@/lib/i18n/format";
import type { LocalePrefs } from "@/lib/i18n/config";

const en: LocalePrefs = {
  language: "en",
  region: "US",
  currency: "USD",
  timezone: "UTC",
  weekStart: 0,
  hour12: true,
};

describe("formatMoney", () => {
  it("formats whole amounts without decimals", () => {
    const out = formatMoney(1000, "USD", en);
    expect(out).toContain("1,000");
    expect(out).not.toContain(".00");
  });
  it("keeps decimals for fractional amounts", () => {
    expect(formatMoney(12.5, "USD", en)).toContain("12.5");
  });
  it("survives an unknown currency code", () => {
    const out = formatMoney(5, "ZZZ", en);
    expect(out).toContain("5");
  });
  it("treats non-finite input as zero", () => {
    expect(formatMoney(NaN, "USD", en)).toContain("0");
  });
});

describe("formatMoneyPrecise", () => {
  it("always shows two fraction digits", () => {
    expect(formatMoneyPrecise(1000, "USD", en)).toContain("1,000.00");
  });
});

describe("formatNumber / formatPercent", () => {
  it("groups thousands", () => {
    expect(formatNumber(12345, en)).toContain("12,345");
  });
  it("formats a ratio as a percent", () => {
    expect(formatPercent(0.25, en)).toContain("25");
    expect(formatPercent(0.25, en)).toContain("%");
  });
});

describe("formatDate / formatRelative", () => {
  it("formats an epoch in the given timezone", () => {
    const ms = Date.UTC(2026, 0, 15, 12, 0, 0);
    const out = formatDate(ms, en, { year: "numeric", month: "short", day: "numeric" });
    expect(out).toContain("2026");
    expect(out).toContain("15");
  });
  it("produces a relative phrase", () => {
    const now = Date.UTC(2026, 0, 15, 12, 0, 0);
    const inThreeDays = now + 3 * 24 * 60 * 60 * 1000;
    expect(formatRelative(inThreeDays, en, now).toLowerCase()).toContain("day");
  });
});
