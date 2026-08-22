/**
 * Realistic account data for a freshly-connected institution. This is the
 * stand-in "feed" behind the connect flow while Renew is pre-licence: it builds
 * a believable 75-day history — salary, rent, groceries, bills, subscriptions —
 * so a new person immediately sees a full, working picture of their money
 * instead of an empty app. When a real Account-Aggregator / open-banking feed is
 * wired, it produces the SAME shape (see ./provider) and nothing downstream
 * changes.
 *
 * Everything here is deterministic per (institution, day) via a seeded RNG, so a
 * connection looks stable rather than random on each render.
 */

import type { AccountType, RepeatRule, Category, TxType } from "@/lib/types";
import type { Institution } from "./banks";

export interface AccountSlot {
  key: string;
  name: string;
  atype: AccountType;
  institution: string;
  currency: string;
  openingBalance: number;
}
export interface TxPlan {
  type: TxType;
  amount: number;
  currency: string;
  category: string;
  note: string;
  date: number;
  accountKey: string;
}
export interface BillPlan {
  name: string;
  amount: number;
  currency: string;
  dueAt: number;
  category: Category;
  repeat: RepeatRule;
}
export interface SubPlan {
  name: string;
  price: number;
  currency: string;
  cycle: "monthly" | "yearly";
  nextBillingAt: number;
  category: string;
}
export interface SyncPlan {
  accounts: AccountSlot[];
  transactions: TxPlan[];
  bills: BillPlan[];
  subscriptions: SubPlan[];
  summary: { accounts: number; transactions: number; bills: number; subscriptions: number; days: number };
}

/** Typical monthly take-home used to scale a believable history, by currency. */
const INCOME_BY_CURRENCY: Record<string, number> = {
  INR: 95000, USD: 5200, EUR: 4600, GBP: 4000, AED: 18000, SGD: 6500,
  AUD: 7000, CAD: 6000, JPY: 430000, CHF: 6500, HKD: 34000, ZAR: 42000,
  BRL: 9000, MXN: 32000, NGN: 650000, PKR: 220000, BDT: 90000,
};

const DAY = 86_400_000;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Build a believable finance history for a just-connected institution. */
export function buildSyncPlan(opts: {
  institution: Institution;
  currency: string;
  now?: number;
}): SyncPlan {
  const now = opts.now ?? Date.now();
  const cur = opts.currency;
  const M = INCOME_BY_CURRENCY[cur] ?? 4000;
  const bigUnit = M > 20000; // INR/JPY-style — round to tens
  const round = (n: number) => (bigUnit ? Math.round(n / 10) * 10 : Math.round(n));
  const rnd = mulberry32(hashStr(opts.institution.id) ^ Math.floor(now / DAY));
  const jitter = (base: number, spread: number) => round(base * (1 + (rnd() - 0.5) * spread));

  const key = "primary";
  const isCashLike = opts.institution.kind === "upi" || opts.institution.kind === "wallet";
  const account: AccountSlot = {
    key,
    name: isCashLike ? opts.institution.name : `${opts.institution.name} Savings`,
    atype: isCashLike ? "other" : "savings",
    institution: opts.institution.name,
    currency: cur,
    openingBalance: round(M * (isCashLike ? 0.4 : 1.6)),
  };

  const tx: TxPlan[] = [];
  const at = (daysAgo: number) => now - daysAgo * DAY;
  const dayOfMonth = new Date(now).getDate();

  // Salary on the 1st of each of the last ~3 months.
  for (let m = 0; m < 3; m++) {
    const daysAgo = dayOfMonth - 1 + m * 30;
    if (daysAgo >= 0 && daysAgo < 78)
      tx.push({ type: "income", amount: jitter(M, 0.04), currency: cur, category: "salary", note: "Salary credit", date: at(daysAgo), accountKey: key });
  }

  // Rent monthly (a few days after salary).
  for (let m = 0; m < 3; m++) {
    const daysAgo = dayOfMonth - 3 + m * 30;
    if (daysAgo >= 0 && daysAgo < 78)
      tx.push({ type: "expense", amount: jitter(M * 0.28, 0.02), currency: cur, category: "rent", note: "Rent", date: at(daysAgo), accountKey: key });
  }

  // Recurring expense templates spread across ~75 days.
  const groceryNames = ["SuperMart", "Fresh Grocers", "Daily Needs", "Green Basket"];
  const foodNames = ["Cafe", "Restaurant", "Food delivery", "Coffee"];
  const shopNames = ["Online store", "Fashion", "Electronics", "Home store"];
  const pushEvery = (
    everyDays: number, base: number, spread: number, category: string, names: string[],
  ) => {
    for (let d = 2; d < 75; d += everyDays + Math.floor(rnd() * 3)) {
      tx.push({
        type: "expense", amount: jitter(base, spread), currency: cur, category,
        note: names[Math.floor(rnd() * names.length)]!, date: at(d), accountKey: key,
      });
    }
  };
  pushEvery(6, M * 0.045, 0.4, "groceries", groceryNames);
  pushEvery(4, M * 0.02, 0.6, "food", foodNames);
  pushEvery(5, M * 0.012, 0.7, "transport", ["Ride", "Fuel", "Metro card", "Taxi"]);
  pushEvery(16, M * 0.05, 0.5, "shopping", shopNames);

  // Monthly utilities as transactions.
  for (let m = 0; m < 2; m++) {
    const base = dayOfMonth - 8 + m * 30;
    if (base >= 0 && base < 78) {
      tx.push({ type: "expense", amount: jitter(M * 0.022, 0.2), currency: cur, category: "bills", note: "Electricity", date: at(base), accountKey: key });
      tx.push({ type: "expense", amount: jitter(M * 0.009, 0.1), currency: cur, category: "bills", note: "Broadband", date: at(base + 2), accountKey: key });
    }
  }

  tx.sort((a, b) => b.date - a.date);

  // Upcoming bills (next 30 days).
  const bills: BillPlan[] = [
    { name: "Electricity", amount: jitter(M * 0.022, 0.15), currency: cur, dueAt: now + 6 * DAY, category: "bills", repeat: "monthly" },
    { name: "Broadband", amount: jitter(M * 0.009, 0.1), currency: cur, dueAt: now + 12 * DAY, category: "bills", repeat: "monthly" },
    { name: "Mobile", amount: jitter(M * 0.006, 0.1), currency: cur, dueAt: now + 20 * DAY, category: "bills", repeat: "monthly" },
  ];

  // Detected subscriptions.
  const subs: SubPlan[] = [
    { name: "Netflix", price: jitter(M * 0.0068, 0), currency: cur, cycle: "monthly", nextBillingAt: now + 8 * DAY, category: "entertainment" },
    { name: "Spotify", price: jitter(M * 0.00125, 0), currency: cur, cycle: "monthly", nextBillingAt: now + 3 * DAY, category: "entertainment" },
    { name: "Cloud storage", price: jitter(M * 0.0008, 0), currency: cur, cycle: "monthly", nextBillingAt: now + 15 * DAY, category: "subscriptions" },
  ];

  return {
    accounts: [account],
    transactions: tx,
    bills,
    subscriptions: subs,
    summary: { accounts: 1, transactions: tx.length, bills: bills.length, subscriptions: subs.length, days: 75 },
  };
}
