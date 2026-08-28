"use client";

import { detectPrefs } from "@/lib/i18n/config";

/**
 * Guest (pre-sign-in) expense capture. The whole point of the setup page: log a
 * first expense within seconds, no sign-in, no questions. Entries live in
 * localStorage until the person signs in, at which point they're imported into
 * their real account (see GuestImport) and cleared here. This never touches the
 * auth/session architecture, so it can't break signed-in users.
 */

export interface GuestTxn {
  id: string;
  type: "expense" | "income";
  amount: number;
  currency: string;
  category: string;
  note?: string;
  date: number;
}

const KEY = "renew-guest-txns";
const EMPTY: GuestTxn[] = [];

// Cached snapshot so getGuestTxns() returns a STABLE reference when nothing has
// changed — required by useSyncExternalStore (a fresh array each call would loop).
let cacheRaw: string | null = null;
let cache: GuestTxn[] = EMPTY;

/** Currency auto-detected from the phone/browser — no question asked. */
export function detectGuestCurrency(): string {
  try {
    return detectPrefs().currency;
  } catch {
    return "USD";
  }
}

export function getGuestTxns(): GuestTxn[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === cacheRaw) return cache; // unchanged → same reference
    cacheRaw = raw;
    if (!raw) {
      cache = EMPTY;
    } else {
      const parsed = JSON.parse(raw) as unknown;
      cache = Array.isArray(parsed) ? (parsed as GuestTxn[]) : EMPTY;
    }
    return cache;
  } catch {
    return cache;
  }
}

export function addGuestTxn(input: Omit<GuestTxn, "id">): GuestTxn {
  const txn: GuestTxn = { ...input, id: `g-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
  try {
    const all = getGuestTxns();
    all.unshift(txn);
    localStorage.setItem(KEY, JSON.stringify(all));
    window.dispatchEvent(new Event("renew-guest-change"));
  } catch {
    /* storage unavailable — the entry is still returned for this session */
  }
  return txn;
}

export function deleteGuestTxn(id: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(getGuestTxns().filter((t) => t.id !== id)));
    window.dispatchEvent(new Event("renew-guest-change"));
  } catch {
    /* ignore */
  }
}

export function clearGuestTxns(): void {
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event("renew-guest-change"));
  } catch {
    /* ignore */
  }
}

export function hasGuestTxns(): boolean {
  return getGuestTxns().length > 0;
}
