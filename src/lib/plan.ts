/**
 * Renew's plans. There are exactly two: Free (everything that makes Renew
 * genuinely useful — no crippling) and Premium (deeper, power-user upgrades).
 *
 * IMPORTANT / honesty: Premium is ADDITIVE. Going Free → Premium only unlocks
 * more; it never removes anything a person already relies on, and downgrading
 * never deletes their data. No real charge happens until a payment provider is
 * connected — the upgrade screen says so plainly and never fakes a purchase.
 */

export type Plan = "free" | "premium";

export const DEFAULT_PLAN: Plan = "free";

export function isPremium(plan: Plan | undefined | null): boolean {
  return plan === "premium";
}

/** A capability a plan grants. `live` = shipped and enforceable today; anything
 *  not live is shown as "coming with Premium", never sold as if it works. */
export interface Perk {
  id: string;
  title: string;
  desc: string;
  /** lucide icon name, resolved by the UI. */
  icon: string;
  /** In the Free plan too? */
  free: boolean;
  /** Actually enforced in code today (vs. a described upcoming perk). */
  live: boolean;
}

/**
 * The comparison shown on the upgrade screen. Kept small and honest — each row
 * is a real capability. As premium features ship, flip `live: true` and gate
 * them with `isPremium`.
 */
export const PERKS: Perk[] = [
  { id: "tracking", title: "Money tracking & budgets", desc: "Log income and spending, set budgets, track it all — always free.", icon: "Wallet", free: true, live: true },
  { id: "ren", title: "Ren, your assistant", desc: "Talk or type to Ren to record money and get answers from your own data.", icon: "Sparkles", free: true, live: true },
  { id: "applock", title: "App-lock & privacy", desc: "iPhone-style passcode, Face ID, hidden balances — your money stays yours.", icon: "ShieldCheck", free: true, live: true },
  { id: "export", title: "Import & export your data", desc: "Bring data in and take it out anytime. Your data is never held hostage.", icon: "Download", free: true, live: true },
  { id: "insights", title: "Advanced insights", desc: "Deeper trends, forecasts and category breakdowns beyond the essentials.", icon: "TrendingUp", free: false, live: false },
  { id: "ren-plus", title: "Ren, proactive", desc: "Ren watches for overspend and upcoming bills and nudges you first.", icon: "Bell", free: false, live: false },
  { id: "bank", title: "Bank & UPI sync", desc: "Securely connect accounts so spending tracks itself (consent-based, read-only).", icon: "Landmark", free: false, live: false },
  { id: "support", title: "Priority support", desc: "Your questions jump the queue.", icon: "Heart", free: false, live: false },
];

/** The perks unique to Premium (what the upgrade actually buys). */
export const PREMIUM_PERKS = PERKS.filter((p) => !p.free);

/** Simple, honest pricing placeholder until a provider is connected. */
export const PREMIUM_PRICE = { amountText: "₹199", period: "/month", note: "Billed monthly, cancel anytime. No charge until you opt in." } as const;
