import { describe, it, expect } from "vitest";
import {
  nextOccurrence,
  fromDateTimeInputs,
  toDateInput,
  isOverdue,
  dayStart,
} from "@/lib/dates";

describe("nextOccurrence", () => {
  const base = new Date(2026, 0, 15, 9, 0, 0).getTime(); // 15 Jan 2026
  it("advances daily/weekly/monthly/yearly", () => {
    expect(new Date(nextOccurrence(base, "daily")).getDate()).toBe(16);
    expect(new Date(nextOccurrence(base, "weekly")).getDate()).toBe(22);
    expect(new Date(nextOccurrence(base, "monthly")).getMonth()).toBe(1);
    expect(new Date(nextOccurrence(base, "yearly")).getFullYear()).toBe(2027);
  });
  it("returns the same instant for 'none'", () => {
    expect(nextOccurrence(base, "none")).toBe(base);
  });
});

describe("fromDateTimeInputs / toDateInput", () => {
  it("combines date + time into a local instant", () => {
    const ms = fromDateTimeInputs("2026-08-17", "09:30");
    const d = new Date(ms);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(7);
    expect(d.getDate()).toBe(17);
    expect(d.getHours()).toBe(9);
    expect(d.getMinutes()).toBe(30);
  });
  it("defaults all-day entries to 9am", () => {
    expect(new Date(fromDateTimeInputs("2026-08-17")).getHours()).toBe(9);
  });
  it("round-trips through toDateInput", () => {
    expect(toDateInput(fromDateTimeInputs("2026-08-17"))).toBe("2026-08-17");
  });
});

describe("isOverdue", () => {
  it("is true for the past and false for the future", () => {
    expect(isOverdue(Date.now() - 60_000)).toBe(true);
    expect(isOverdue(Date.now() + 60_000)).toBe(false);
  });
});

describe("dayStart", () => {
  it("zeroes the time component", () => {
    const d = new Date(dayStart(new Date(2026, 5, 15, 13, 45).getTime()));
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
    expect(d.getDate()).toBe(15);
  });
});
