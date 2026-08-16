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
} from "date-fns";

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

export { isToday };
