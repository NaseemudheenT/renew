import {
  format,
  formatDistanceToNowStrict,
  isToday,
  isTomorrow,
  isYesterday,
  isPast,
  startOfDay,
  endOfDay,
  differenceInCalendarDays,
  addDays,
  addWeeks,
  addMonths,
  addYears,
} from "date-fns";
import type { RepeatRule } from "@/lib/types";

/** "in 3 days", "2 hours ago" — compact relative time. */
export function relativeTime(ms: number): string {
  return formatDistanceToNowStrict(new Date(ms), { addSuffix: true });
}

/** Human due label: Today / Tomorrow / Mon, 4 Aug, with optional time. */
export function dueLabel(ms: number, hasTime = false): string {
  const d = new Date(ms);
  const time = hasTime ? ` · ${format(d, "h:mm a")}` : "";
  if (isToday(d)) return `Today${time}`;
  if (isTomorrow(d)) return `Tomorrow${time}`;
  if (isYesterday(d)) return `Yesterday${time}`;
  return `${format(d, "EEE, d MMM")}${time}`;
}

/** Short date, e.g. "4 Aug 2026". */
export function shortDate(ms: number): string {
  return format(new Date(ms), "d MMM yyyy");
}

export function timeLabel(ms: number): string {
  return format(new Date(ms), "h:mm a");
}

export function isOverdue(ms: number): boolean {
  return isPast(new Date(ms));
}

/** Days until a date (negative = past). */
export function daysUntil(ms: number): number {
  return differenceInCalendarDays(new Date(ms), new Date());
}

export function dayStart(ms: number): number {
  return startOfDay(new Date(ms)).getTime();
}
export function dayEnd(ms: number): number {
  return endOfDay(new Date(ms)).getTime();
}

export const todayStart = () => startOfDay(new Date()).getTime();
export const todayEnd = () => endOfDay(new Date()).getTime();

/**
 * Advance a due date to its next occurrence for a repeat rule. Repeats from the
 * previous due date so a slightly-late completion still lands on schedule.
 */
export function nextOccurrence(ms: number, repeat: RepeatRule): number {
  const d = new Date(ms);
  switch (repeat) {
    case "daily":
      return addDays(d, 1).getTime();
    case "weekly":
      return addWeeks(d, 1).getTime();
    case "monthly":
      return addMonths(d, 1).getTime();
    case "yearly":
      return addYears(d, 1).getTime();
    default:
      return ms;
  }
}

/* ---- Native <input> value helpers --------------------------------------- */

export function toDateInput(ms: number): string {
  return format(new Date(ms), "yyyy-MM-dd");
}
export function toTimeInput(ms: number): string {
  return format(new Date(ms), "HH:mm");
}
/** Combine a date input ("yyyy-MM-dd") and optional time ("HH:mm") to millis. */
export function fromDateTimeInputs(date: string, time?: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const base = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
  if (time) {
    const [hh, mm] = time.split(":").map(Number);
    base.setHours(hh ?? 0, mm ?? 0, 0, 0);
  } else {
    base.setHours(9, 0, 0, 0); // default all-day reminders to 9am
  }
  return base.getTime();
}

export { isToday };
