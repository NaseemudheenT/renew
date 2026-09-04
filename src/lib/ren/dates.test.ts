import { describe, it, expect } from "vitest";
import { timeframeBounds, resolveDate } from "./dates";

// Fixed instant: 15 June 2024, 12:00 UTC. Using UTC tz makes bounds exact.
const NOW = Date.UTC(2024, 5, 15, 12, 0, 0);
const TZ = "UTC";
const DAY = 86_400_000;

describe("ren/dates.timeframeBounds (UTC)", () => {
  it("this_month spans the calendar month", () => {
    const b = timeframeBounds("this_month", TZ, NOW);
    expect(b.start).toBe(Date.UTC(2024, 5, 1));
    expect(b.end).toBe(Date.UTC(2024, 6, 1));
  });
  it("last_month spans the previous month", () => {
    const b = timeframeBounds("last_month", TZ, NOW);
    expect(b.start).toBe(Date.UTC(2024, 4, 1));
    expect(b.end).toBe(Date.UTC(2024, 5, 1));
  });
  it("today is a single day", () => {
    const b = timeframeBounds("today", TZ, NOW);
    expect(b.start).toBe(Date.UTC(2024, 5, 15));
    expect(b.end).toBe(Date.UTC(2024, 5, 16));
  });
  it("yesterday is the prior day", () => {
    const b = timeframeBounds("yesterday", TZ, NOW);
    expect(b.start).toBe(Date.UTC(2024, 5, 14));
    expect(b.end).toBe(Date.UTC(2024, 5, 15));
  });
  it("this_year spans the calendar year", () => {
    const b = timeframeBounds("this_year", TZ, NOW);
    expect(b.start).toBe(Date.UTC(2024, 0, 1));
    expect(b.end).toBe(Date.UTC(2025, 0, 1));
  });
  it("all is unbounded", () => {
    const b = timeframeBounds("all", TZ, NOW);
    expect(b.start).toBe(0);
    expect(b.end).toBe(Number.MAX_SAFE_INTEGER);
  });
});

describe("ren/dates.resolveDate (UTC)", () => {
  it("today ≈ now", () => {
    expect(resolveDate("today", TZ, NOW)).toBeGreaterThanOrEqual(Date.UTC(2024, 5, 15));
  });
  it("yesterday lands on the previous day", () => {
    const r = resolveDate("yesterday", TZ, NOW);
    expect(r).toBeGreaterThanOrEqual(Date.UTC(2024, 5, 14));
    expect(r).toBeLessThan(Date.UTC(2024, 5, 15));
  });
  it("'3 days ago' subtracts three days", () => {
    const r = resolveDate("3 days ago", TZ, NOW);
    expect(Math.round((NOW - r) / DAY)).toBe(3);
  });
  it("parses an ISO date", () => {
    const r = resolveDate("2024-03-10", TZ, NOW);
    expect(r).toBeGreaterThanOrEqual(Date.UTC(2024, 2, 10));
    expect(r).toBeLessThan(Date.UTC(2024, 2, 11));
  });
  it("empty falls back to now", () => {
    expect(resolveDate(undefined, TZ, NOW)).toBe(NOW);
  });
});
