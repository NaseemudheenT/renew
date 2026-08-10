import type { Reminder } from "@/lib/firestore/types";

/** Whole days from today (local) until an ISO date. Negative = past. */
export function daysUntil(isoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(isoDate + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export type Urgency = "overdue" | "soon" | "upcoming" | "later";

export function urgency(isoDate: string): Urgency {
  const d = daysUntil(isoDate);
  if (d < 0) return "overdue";
  if (d <= 7) return "soon";
  if (d <= 30) return "upcoming";
  return "later";
}

/** Human, localized due-date label. */
export function formatDueDate(isoDate: string, locale?: string): string {
  return new Date(isoDate + "T00:00:00").toLocaleDateString(locale || undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "in 3 days", "today", "5 days ago". */
export function relativeDue(isoDate: string): string {
  const d = daysUntil(isoDate);
  if (d === 0) return "Today";
  if (d === 1) return "Tomorrow";
  if (d === -1) return "Yesterday";
  if (d > 1) return `in ${d} days`;
  return `${Math.abs(d)} days ago`;
}

/** Sort: incomplete first (by soonest due), completed last. */
export function sortReminders(list: Reminder[]): Reminder[] {
  return [...list].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return a.dueDate.localeCompare(b.dueDate);
  });
}

/** Today's date as yyyy-mm-dd (for date inputs / min). */
export function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
