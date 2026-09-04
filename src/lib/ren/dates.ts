/**
 * REN temporal understanding (spec §14). All ranges resolve in the USER's
 * timezone, using the `now` the client reports (the client knows the real local
 * time; the server clock is UTC on Vercel and must never be used blindly).
 *
 * DST note: bounds use the tz offset at `now`. A range that straddles a DST
 * change can be off by an hour at the very edge — immaterial for month-level
 * money analytics, and honest (REN frames analytics as "from your recorded data").
 */

import type { z } from "zod";
import type { timeframeSchema } from "./schemas";

export type Timeframe = z.infer<typeof timeframeSchema>;

/** ms to add to a UTC instant to read it as wall-clock time in `tz`. */
function tzOffsetMs(tz: string, at: number): number {
  try {
    const d = new Date(at);
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    const p = dtf.formatToParts(d).reduce<Record<string, string>>((a, x) => { a[x.type] = x.value; return a; }, {});
    const asUTC = Date.UTC(+p.year!, +p.month! - 1, +p.day!, +p.hour!, +p.minute!, +p.second!);
    return asUTC - d.getTime();
  } catch {
    return 0; // unknown tz → treat as UTC
  }
}

/** Wall-clock Y/M/D in the user's tz for a given instant. */
function partsInTz(tz: string, at: number): { y: number; m: number; d: number } {
  const off = tzOffsetMs(tz, at);
  const local = new Date(at + off);
  return { y: local.getUTCFullYear(), m: local.getUTCMonth(), d: local.getUTCDate() };
}

/** Epoch ms for local midnight of a Y/M/D in `tz`. */
function localMidnight(tz: string, y: number, m: number, d: number, nowRef: number): number {
  const guess = Date.UTC(y, m, d, 0, 0, 0);
  return guess - tzOffsetMs(tz, nowRef);
}

const DAY = 86_400_000;

/** Start/end epoch bounds [start, end) for a timeframe in the user's tz. */
export function timeframeBounds(tf: Timeframe, tz: string, now: number): { start: number; end: number } {
  const { y, m, d } = partsInTz(tz, now);
  const todayStart = localMidnight(tz, y, m, d, now);
  switch (tf) {
    case "today": return { start: todayStart, end: todayStart + DAY };
    case "yesterday": return { start: todayStart - DAY, end: todayStart };
    case "this_week": { const dow = new Date(todayStart + tzOffsetMs(tz, now)).getUTCDay(); const start = todayStart - dow * DAY; return { start, end: start + 7 * DAY }; }
    case "last_week": { const dow = new Date(todayStart + tzOffsetMs(tz, now)).getUTCDay(); const thisStart = todayStart - dow * DAY; return { start: thisStart - 7 * DAY, end: thisStart }; }
    case "last_month": return { start: localMidnight(tz, y, m - 1, 1, now), end: localMidnight(tz, y, m, 1, now) };
    case "this_year": return { start: localMidnight(tz, y, 0, 1, now), end: localMidnight(tz, y + 1, 0, 1, now) };
    case "all": return { start: 0, end: Number.MAX_SAFE_INTEGER };
    case "this_month":
    default: return { start: localMidnight(tz, y, m, 1, now), end: localMidnight(tz, y, m + 1, 1, now) };
  }
}

/** Resolve a natural or ISO date phrase to an epoch (local noon, so day is stable). */
export function resolveDate(phrase: string | undefined, tz: string, now: number): number {
  const { y, m, d } = partsInTz(tz, now);
  const noon = (yy: number, mm: number, dd: number) => localMidnight(tz, yy, mm, dd, now) + 12 * 3_600_000;
  if (!phrase) return now;
  const p = phrase.trim().toLowerCase();
  if (!p || p === "today" || p === "now") return now;
  if (p === "yesterday") return noon(y, m, d - 1);
  if (p === "tomorrow") return noon(y, m, d + 1);
  const daysAgo = p.match(/(\d+)\s*days?\s*ago/); if (daysAgo) return noon(y, m, d - Number(daysAgo[1]));
  const weeksAgo = p.match(/(\d+)\s*weeks?\s*ago/); if (weeksAgo) return noon(y, m, d - 7 * Number(weeksAgo[1]));
  if (/last month/.test(p)) return noon(y, m - 1, d);
  if (/next month/.test(p)) return noon(y, m + 1, d);
  if (/beginning of (the )?month/.test(p)) return noon(y, m, 1);
  if (/end of (the )?month/.test(p)) return noon(y, m + 1, 0);
  const iso = p.match(/(\d{4})-(\d{2})-(\d{2})/); if (iso) return noon(+iso[1]!, +iso[2]! - 1, +iso[3]!);
  const t = Date.parse(phrase); if (!Number.isNaN(t)) return t;
  return now;
}
