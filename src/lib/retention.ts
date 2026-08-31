/**
 * Data retention — an optional "auto-clean" so a person's Renew only keeps as
 * much history as they want. Off by default (keep everything). When a window is
 * chosen, transactions strictly older than it are removed. Deliberately tiny and
 * pure so the "what gets deleted" decision is trivial to reason about and test —
 * deleting money data must never be surprising.
 */

export const RETENTION_OPTIONS: { days: number; label: string; sub: string }[] = [
  { days: 0, label: "Keep everything", sub: "Never delete (default)" },
  { days: 365, label: "1 year", sub: "Remove entries older than a year" },
  { days: 180, label: "6 months", sub: "Remove entries older than 6 months" },
  { days: 90, label: "3 months", sub: "Remove entries older than 3 months" },
];

const DAY = 86_400_000;

/** The label for a chosen retention window (for display). */
export function retentionLabel(days: number | undefined): string {
  return RETENTION_OPTIONS.find((o) => o.days === (days ?? 0))?.label ?? "Keep everything";
}

/**
 * IDs of dated items STRICTLY older than the retention window. Returns nothing
 * when retention is off (days <= 0) — the safe default that never deletes.
 */
export function expiredIds<T extends { id: string; date: number }>(
  items: T[],
  retentionDays: number | undefined,
  now: number = Date.now(),
): string[] {
  if (!retentionDays || retentionDays <= 0) return [];
  const cutoff = now - retentionDays * DAY;
  return items.filter((it) => it.date < cutoff).map((it) => it.id);
}
