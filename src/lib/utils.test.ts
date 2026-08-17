import { describe, it, expect } from "vitest";
import {
  clamp,
  mulberry32,
  formatBytes,
  isImageFormat,
  formatMoney,
} from "@/lib/utils";

describe("clamp", () => {
  it("bounds to the range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });
});

describe("mulberry32", () => {
  it("is deterministic for a seed and in [0,1)", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const first = a();
    expect(first).toBe(b());
    expect(first).toBeGreaterThanOrEqual(0);
    expect(first).toBeLessThan(1);
  });
});

describe("formatBytes", () => {
  it("formats across units", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(1024 * 1024)).toBe("1.0 MB");
  });
});

describe("isImageFormat", () => {
  it("detects image extensions case-insensitively", () => {
    expect(isImageFormat("PNG")).toBe(true);
    expect(isImageFormat("pdf")).toBe(false);
  });
});

describe("formatMoney (util fallback)", () => {
  it("formats a known currency", () => {
    expect(formatMoney(1000, "USD")).toContain("1,000");
  });
});
