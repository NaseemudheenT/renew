import type { Transaction, TxType, BillingCycle } from "@/lib/types";

/**
 * Recurring-payment detection (Phase 2 — Financial Intelligence).
 *
 * Pure, deterministic pattern-finding over the person's own transactions — no
 * AI, no guessing at arithmetic. We group transactions that look like the same
 * thing (same cleaned description, or category), and flag a group as recurring
 * when it repeats on a steady cadence (weekly / monthly / quarterly / yearly)
 * with a stable amount. The result is a suggestion the person confirms — Renew
 * never invents a charge.
 */

export interface RecurringCandidate {
  /** Stable key for this pattern (used to ignore/track it). */
  key: string;
  /** A friendly name (from the description, else the category). */
  name: string;
  type: TxType;
  category: string;
  currency: string;
  /** Typical (median) amount per occurrence. */
  amount: number;
  cycle: BillingCycle;
  occurrences: number;
  /** Epoch millis of the most recent occurrence. */
  lastAt: number;
  /** Epoch millis of the next expected occurrence. */
  nextAt: number;
  /** Normalised monthly cost, for ranking. */
  monthly: number;
}

const DAY = 86_400_000;

/** Strip digits, punctuation and dates so "NETFLIX 12/03" and "Netflix" group. */
export function recurringKey(t: Pick<Transaction, "note" | "category" | "type">): string {
  const base = (t.note ?? "").toLowerCase().replace(/[0-9]+/g, " ").replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
  return `${t.type}:${base || `cat:${t.category}`}`;
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

/** Map a median gap (in days) to a billing cycle, or null if it isn't a clean one. */
function cycleForGap(days: number): { cycle: BillingCycle; periodDays: number } | null {
  if (days >= 5 && days <= 10) return { cycle: "weekly", periodDays: 7 };
  if (days >= 24 && days <= 38) return { cycle: "monthly", periodDays: 30 };
  if (days >= 75 && days <= 105) return { cycle: "quarterly", periodDays: 91 };
  if (days >= 320 && days <= 400) return { cycle: "yearly", periodDays: 365 };
  return null;
}

const MONTHLY_FACTOR: Record<BillingCycle, number> = {
  weekly: 52 / 12,
  monthly: 1,
  quarterly: 1 / 3,
  yearly: 1 / 12,
};

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Detect recurring patterns. Needs at least `minOccurrences` (default 3) evenly
 * spaced transactions with a stable amount to call something recurring.
 */
export function detectRecurring(
  transactions: Transaction[],
  opts: { minOccurrences?: number; now?: number } = {},
): RecurringCandidate[] {
  const minOccurrences = opts.minOccurrences ?? 3;
  const now = opts.now ?? Date.now();

  const groups = new Map<string, Transaction[]>();
  for (const t of transactions) {
    const key = recurringKey(t);
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(t);
  }

  const out: RecurringCandidate[] = [];
  for (const [key, items] of groups) {
    if (items.length < minOccurrences) continue;
    const sorted = [...items].sort((a, b) => a.date - b.date);

    // Gaps between consecutive occurrences (in days).
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) gaps.push((sorted[i]!.date - sorted[i - 1]!.date) / DAY);
    const medianGap = median(gaps);
    const cyc = cycleForGap(medianGap);
    if (!cyc) continue;

    // Cadence must be steady — every gap within 45% of the median.
    const steady = gaps.every((g) => Math.abs(g - medianGap) <= medianGap * 0.45);
    if (!steady) continue;

    // Amount must be stable — every amount within 25% of the median.
    const amounts = sorted.map((t) => t.amount);
    const medianAmount = median(amounts);
    if (medianAmount <= 0) continue;
    const stableAmount = amounts.every((a) => Math.abs(a - medianAmount) <= medianAmount * 0.25);
    if (!stableAmount) continue;

    // Skip patterns that have clearly stopped (last seen > 1.6 periods ago).
    const last = sorted[sorted.length - 1]!;
    if (now - last.date > cyc.periodDays * DAY * 1.6) continue;

    const noteName = (last.note ?? "").replace(/[0-9]/g, "").replace(/\s+/g, " ").trim();
    const name = noteName ? titleCase(noteName) : "";

    out.push({
      key,
      name: name || last.category,
      type: last.type,
      category: last.category,
      currency: last.currency,
      amount: Math.round(medianAmount * 100) / 100,
      cycle: cyc.cycle,
      occurrences: sorted.length,
      lastAt: last.date,
      nextAt: last.date + cyc.periodDays * DAY,
      monthly: Math.round(medianAmount * MONTHLY_FACTOR[cyc.cycle] * 100) / 100,
    });
  }

  // Biggest recurring cost first.
  return out.sort((a, b) => b.monthly - a.monthly);
}

/** True if a detected pattern already matches a tracked subscription (by name + amount). */
export function matchesTracked(
  candidate: RecurringCandidate,
  tracked: { name: string; price: number }[],
): boolean {
  const cn = candidate.name.toLowerCase().trim();
  return tracked.some((s) => {
    const sn = s.name.toLowerCase().trim();
    const nameClose = sn.includes(cn) || cn.includes(sn);
    const priceClose = Math.abs(s.price - candidate.amount) <= candidate.amount * 0.25;
    return nameClose && priceClose;
  });
}
