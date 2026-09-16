/**
 * Renew's plans — the concrete business model.
 *
 * Two tiers: **Free** (the growth engine — everything that proves Renew works,
 * with a generous monthly scan allowance) and **Premium** (the convenience
 * upgrade people pay for: unlimited receipt scans, bank/SMS auto-import,
 * unlimited budgets & goals, PDF/CSV reports, priority sync).
 *
 * HONESTY (hard rules):
 *  - Premium is ADDITIVE. Going Free → Premium only unlocks more; downgrading
 *    never deletes anything.
 *  - No real charge happens until the payment provider (founder's HDFC merchant)
 *    is connected. Until then the upgrade screen enrols early access — it never
 *    fakes a purchase.
 *  - `live: true` on a perk means it is actually enforced in code today. A perk
 *    that is still coming is shown honestly as "soon", never sold as working.
 */

export type Plan = "free" | "premium";
export type BillingPeriod = "monthly" | "yearly";

export const DEFAULT_PLAN: Plan = "free";

export function isPremium(plan: Plan | undefined | null): boolean {
  return plan === "premium";
}

/* ------------------------------------------------------------------------- */
/* Pricing — region-aware. Founder's guidance: ~₹150–400/mo or ~$3–6/mo, with */
/* an annual plan at a discount, plus a one-time report add-on for free users. */
/* ------------------------------------------------------------------------- */

export interface PlanPrice {
  /** ISO-4217 code this price is quoted in. */
  currency: string;
  symbol: string;
  monthly: number;
  yearly: number;
  /** One-time PDF/CSV report for free-tier users who don't want a subscription. */
  oneTimeReport: number;
}

const INR: PlanPrice = { currency: "INR", symbol: "₹", monthly: 199, yearly: 1499, oneTimeReport: 99 };
const USD: PlanPrice = { currency: "USD", symbol: "$", monthly: 4.99, yearly: 39.99, oneTimeReport: 1.99 };
const EUR: PlanPrice = { currency: "EUR", symbol: "€", monthly: 4.99, yearly: 39.99, oneTimeReport: 1.99 };

/** The price sheet for a user, chosen from their display currency. */
export function planPricing(currency?: string | null): PlanPrice {
  switch ((currency ?? "").toUpperCase()) {
    case "INR":
      return INR;
    case "EUR":
      return EUR;
    default:
      return USD;
  }
}

/** Whole-percent saving of the annual plan vs. 12× the monthly price. */
export function yearlySavingPct(price: PlanPrice): number {
  const full = price.monthly * 12;
  if (full <= 0) return 0;
  return Math.round((1 - price.yearly / full) * 100);
}

/** Format a price in its own currency, trimming a trailing .00. */
export function formatPlanPrice(price: PlanPrice, amount: number): string {
  const n = Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
  return `${price.symbol}${n}`;
}

/* ------------------------------------------------------------------------- */
/* Free-tier limits — real, enforced caps that make the tiering meaningful    */
/* without crippling the free experience (it's the growth engine).            */
/* ------------------------------------------------------------------------- */

export interface FreeLimits {
  /** Receipt/bill photo scans a free user may run each calendar month. */
  scansPerMonth: number;
  /** Category budgets a free user may keep at once. */
  budgets: number;
  /** Savings goals a free user may keep at once. */
  goals: number;
}

export const FREE_LIMITS: FreeLimits = {
  scansPerMonth: 12,
  budgets: 8,
  goals: 3,
};

/** Calendar-month key ("YYYY-MM") used to reset the monthly scan allowance. */
export function monthKey(at: number): string {
  const d = new Date(at);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export interface ScanUsage {
  /** Month the count belongs to ("YYYY-MM"). */
  month: string;
  count: number;
}

export interface ScanQuota {
  unlimited: boolean;
  limit: number;
  used: number;
  remaining: number;
}

/**
 * How many receipt scans this user has left. Premium is unlimited; a free
 * user's count resets when the calendar month changes. Pure + testable.
 */
export function scanQuota(premium: boolean, usage: ScanUsage | undefined, at: number): ScanQuota {
  if (premium) return { unlimited: true, limit: Infinity, used: 0, remaining: Infinity };
  const limit = FREE_LIMITS.scansPerMonth;
  const used = usage && usage.month === monthKey(at) ? usage.count : 0;
  return { unlimited: false, limit, used, remaining: Math.max(0, limit - used) };
}

/** The next usage record after one scan (rolls over at a month boundary). */
export function nextScanUsage(usage: ScanUsage | undefined, at: number): ScanUsage {
  const m = monthKey(at);
  if (usage && usage.month === m) return { month: m, count: usage.count + 1 };
  return { month: m, count: 1 };
}

/* ------------------------------------------------------------------------- */
/* Feature comparison shown on the upgrade screen.                            */
/* ------------------------------------------------------------------------- */

/** A capability row. `live` = enforced in code today (vs. an honest "soon"). */
export interface Perk {
  id: string;
  title: string;
  desc: string;
  /** lucide icon name, resolved by the UI. */
  icon: string;
  /** Included in Free too? */
  free: boolean;
  /** Actually enforced in code today. */
  live: boolean;
}

/** What Free gives — deliberately generous so the app proves itself. */
export const FREE_PERKS: Perk[] = [
  { id: "quickadd", title: "Quick add & manual tracking", desc: "Log an expense in under 10 seconds — amount, category, done.", icon: "Wallet", free: true, live: true },
  { id: "scan-free", title: `${FREE_LIMITS.scansPerMonth} receipt scans / month`, desc: "Snap a bill and Renew fills in the amount, date and merchant.", icon: "ScanLine", free: true, live: true },
  { id: "autocat", title: "Auto-categorization", desc: "Transactions sort themselves into categories, editable with one tap.", icon: "Tags", free: true, live: true },
  { id: "budgets-free", title: `Budgets (up to ${FREE_LIMITS.budgets})`, desc: "Simple monthly limits with a clear “how much left”.", icon: "Target", free: true, live: true },
  { id: "goals-free", title: `Savings goals (up to ${FREE_LIMITS.goals})`, desc: "Set a target and watch it fill.", icon: "PiggyBank", free: true, live: true },
  { id: "multi", title: "Multi-account & multi-currency", desc: "Bank, cash, cards and wallets across India, the US and Europe.", icon: "Landmark", free: true, live: true },
  { id: "summary", title: "Monthly summary & search", desc: "Income vs spend vs saved, this month vs last — and find anything fast.", icon: "TrendingUp", free: true, live: true },
  { id: "recurring", title: "Recurring & bill reminders", desc: "Renew spots recurring charges and reminds you before they're due.", icon: "Bell", free: true, live: true },
  { id: "applock", title: "App-lock & privacy", desc: "Passcode, Face ID and hidden balances — your money stays yours.", icon: "ShieldCheck", free: true, live: true },
  { id: "ren", title: "Ren, your assistant", desc: "Talk or type to record money and get answers from your own data.", icon: "Sparkles", free: true, live: true },
];

/** What Premium adds — the convenience people pay for. */
export const PREMIUM_PERKS: Perk[] = [
  { id: "scan-unlimited", title: "Unlimited receipt scans", desc: "Scan as many bills as you like, every month.", icon: "ScanLine", free: false, live: true },
  { id: "autoimport", title: "Bank & SMS auto-import", desc: "Transactions flow in on their own so manual entry isn't the main path.", icon: "Landmark", free: false, live: false },
  { id: "unlimited", title: "Unlimited budgets & goals", desc: "No caps — track every category and every goal you care about.", icon: "Target", free: false, live: false },
  { id: "reports", title: "PDF & CSV reports", desc: "Clean, shareable summaries for your records or your accountant.", icon: "Download", free: false, live: false },
  { id: "insights", title: "Advanced insights & proactive Ren", desc: "Deeper trends and forecasts; Ren warns you before you overspend.", icon: "Sparkles", free: false, live: false },
  { id: "sync", title: "Priority sync & support", desc: "Faster sync across devices, and your questions jump the queue.", icon: "Heart", free: false, live: false },
];

/** Kept for backward-compatibility with existing imports. */
export const PERKS: Perk[] = [...FREE_PERKS, ...PREMIUM_PERKS];
