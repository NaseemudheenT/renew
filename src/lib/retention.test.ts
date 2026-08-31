import { describe, it, expect } from "vitest";
import { expiredIds, retentionLabel } from "./retention";

const NOW = new Date(2024, 5, 15).getTime();
const DAY = 86_400_000;
function item(id: string, daysAgo: number) {
  return { id, date: NOW - daysAgo * DAY };
}

describe("retention.expiredIds", () => {
  const items = [item("new", 10), item("old", 200), item("ancient", 400)];

  it("deletes nothing when retention is off (0 / undefined)", () => {
    expect(expiredIds(items, 0, NOW)).toEqual([]);
    expect(expiredIds(items, undefined, NOW)).toEqual([]);
  });

  it("returns only items strictly older than the window", () => {
    expect(expiredIds(items, 365, NOW)).toEqual(["ancient"]);
    expect(expiredIds(items, 180, NOW)).toEqual(["old", "ancient"]);
    expect(expiredIds(items, 90, NOW)).toEqual(["old", "ancient"]);
  });

  it("keeps an item exactly at the boundary", () => {
    // exactly 90 days old is NOT older than the 90-day window.
    expect(expiredIds([item("edge", 90)], 90, NOW)).toEqual([]);
    expect(expiredIds([item("edge", 91)], 90, NOW)).toEqual(["edge"]);
  });
});

describe("retention.retentionLabel", () => {
  it("names each window", () => {
    expect(retentionLabel(0)).toBe("Keep everything");
    expect(retentionLabel(365)).toBe("1 year");
    expect(retentionLabel(undefined)).toBe("Keep everything");
  });
});
