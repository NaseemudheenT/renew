import { describe, it, expect } from "vitest";
import {
  detectPrefs,
  resolvePrefs,
  weekStartFor,
  hour12For,
  directionFor,
  languageOptions,
  LANGUAGES,
  REGION_CURRENCY,
  FALLBACK_PREFS,
} from "@/lib/i18n/config";

describe("detectPrefs", () => {
  it("returns a well-formed, self-consistent LocalePrefs", () => {
    const p = detectPrefs();
    expect(LANGUAGES.some((l) => l.code === p.language)).toBe(true);
    expect(p.currency).toHaveLength(3);
    expect(typeof p.timezone).toBe("string");
    expect([0, 1]).toContain(p.weekStart);
  });
  it("never defaults to India", () => {
    // The neutral fallback (used when nothing can be detected) is US/USD.
    expect(FALLBACK_PREFS.region).not.toBe("IN");
    expect(FALLBACK_PREFS.currency).not.toBe("INR");
  });
});

describe("resolvePrefs", () => {
  it("returns detected when there is no saved override", () => {
    expect(resolvePrefs(FALLBACK_PREFS, null)).toEqual(FALLBACK_PREFS);
  });
  it("derives currency + week start from a changed region", () => {
    const out = resolvePrefs(FALLBACK_PREFS, { region: "GB" });
    expect(out.region).toBe("GB");
    expect(out.currency).toBe("GBP");
    expect(out.weekStart).toBe(1); // UK starts on Monday
  });
  it("keeps an explicit currency override even when region changes", () => {
    const out = resolvePrefs(FALLBACK_PREFS, { region: "GB", currency: "USD" });
    expect(out.currency).toBe("USD");
  });
  it("normalizes an unsupported language to en", () => {
    expect(resolvePrefs(FALLBACK_PREFS, { language: "xx" }).language).toBe("en");
  });
});

describe("region helpers", () => {
  it("maps regions to their currency", () => {
    expect(REGION_CURRENCY.IN).toBe("INR");
    expect(REGION_CURRENCY.JP).toBe("JPY");
    expect(REGION_CURRENCY.DE).toBe("EUR");
  });
  it("week start: US Sunday, FR Monday", () => {
    expect(weekStartFor("US")).toBe(0);
    expect(weekStartFor("FR")).toBe(1);
  });
  it("hour12: US true, DE false", () => {
    expect(hour12For("US")).toBe(true);
    expect(hour12For("DE")).toBe(false);
  });
  it("direction: en ltr, ar rtl", () => {
    expect(directionFor("en")).toBe("ltr");
    expect(directionFor("ar")).toBe("rtl");
    expect(directionFor("ar-EG")).toBe("rtl");
  });
});

describe("languageOptions", () => {
  const opts = languageOptions("en");

  it("offers a large, global set with codes, labels and native names", () => {
    expect(opts.length).toBeGreaterThan(90);
    for (const o of opts) {
      expect(o.code).toMatch(/^[a-z]{2,3}$/);
      expect(o.label.length).toBeGreaterThan(0);
      expect(o.native.length).toBeGreaterThan(0);
    }
  });
  it("has no duplicate display labels (e.g. tl/fil collapsing to Filipino)", () => {
    const labels = opts.map((o) => o.label);
    expect(new Set(labels).size).toBe(labels.length);
  });
  it("is sorted A–Z by the localized label", () => {
    const labels = opts.map((o) => o.label);
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b, "en")));
  });
  it("marks Arabic as rtl and English as ltr", () => {
    expect(opts.find((o) => o.code === "ar")?.dir).toBe("rtl");
    expect(opts.find((o) => o.code === "en")?.dir).toBe("ltr");
  });
});
