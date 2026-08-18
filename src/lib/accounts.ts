import {
  Wallet,
  Landmark,
  PiggyBank,
  CreditCard,
  TrendingUp,
  Coins,
  Repeat,
  type LucideIcon,
} from "lucide-react";
import { addWeeks, addMonths, addYears } from "date-fns";
import type {
  Account,
  AccountType,
  Transaction,
  Transfer,
  Subscription,
  BillingCycle,
} from "@/lib/types";

/* ---- Account type metadata ---------------------------------------------- */

export interface AccountTypeMeta {
  value: AccountType;
  label: string;
  icon: LucideIcon;
}

export const ACCOUNT_TYPES: AccountTypeMeta[] = [
  { value: "cash", label: "Cash", icon: Coins },
  { value: "bank", label: "Bank", icon: Landmark },
  { value: "savings", label: "Savings", icon: PiggyBank },
  { value: "credit", label: "Credit card", icon: CreditCard },
  { value: "investment", label: "Investment", icon: TrendingUp },
  { value: "other", label: "Other", icon: Wallet },
];

export function accountTypeMeta(t: AccountType): AccountTypeMeta {
  return ACCOUNT_TYPES.find((x) => x.value === t) ?? ACCOUNT_TYPES[5]!;
}

/**
 * Derive an account's current balance from its opening balance, the
 * transactions attributed to it, and transfers in/out. Only items in the
 * account's own currency are counted — currencies are never mixed as identical.
 */
export function computeAccountBalance(
  account: Account,
  txs: Transaction[],
  transfers: Transfer[],
): number {
  let balance = account.openingBalance;
  for (const t of txs) {
    if (t.accountId !== account.id || t.currency !== account.currency) continue;
    balance += t.type === "income" ? t.amount : -t.amount;
  }
  for (const tr of transfers) {
    if (tr.currency !== account.currency) continue;
    if (tr.fromAccountId === account.id) balance -= tr.amount;
    if (tr.toAccountId === account.id) balance += tr.amount;
  }
  return balance;
}

/** Sum of current balances across active accounts sharing a currency. */
export function totalByCurrency(
  accounts: Account[],
  txs: Transaction[],
  transfers: Transfer[],
  currency: string,
): number {
  return accounts
    .filter((a) => a.status === "active" && a.currency === currency)
    .reduce((sum, a) => sum + computeAccountBalance(a, txs, transfers), 0);
}

/* ---- Subscription metadata ---------------------------------------------- */

export interface BillingCycleMeta {
  value: BillingCycle;
  label: string;
  /** Multiplier from one charge to a monthly-equivalent cost. */
  monthlyFactor: number;
}

export const BILLING_CYCLES: BillingCycleMeta[] = [
  { value: "weekly", label: "Weekly", monthlyFactor: 52 / 12 },
  { value: "monthly", label: "Monthly", monthlyFactor: 1 },
  { value: "quarterly", label: "Quarterly", monthlyFactor: 1 / 3 },
  { value: "yearly", label: "Yearly", monthlyFactor: 1 / 12 },
];

export function billingCycleMeta(c: BillingCycle): BillingCycleMeta {
  return BILLING_CYCLES.find((x) => x.value === c) ?? BILLING_CYCLES[1]!;
}

export const subscriptionIcon = Repeat;

/** Monthly-equivalent cost of one subscription. */
export function subscriptionMonthly(sub: Subscription): number {
  return sub.price * billingCycleMeta(sub.cycle).monthlyFactor;
}

/** Annual (yearly) cost of one subscription. */
export function subscriptionAnnual(sub: Subscription): number {
  return subscriptionMonthly(sub) * 12;
}

export interface SubscriptionTotals {
  monthly: number;
  annual: number;
}

/** Monthly + annual totals for active subscriptions in a given currency. */
export function subscriptionTotals(
  subs: Subscription[],
  currency: string,
): SubscriptionTotals {
  let monthly = 0;
  for (const s of subs) {
    if (s.status !== "active" || s.currency !== currency) continue;
    monthly += subscriptionMonthly(s);
  }
  return { monthly, annual: monthly * 12 };
}

/** Advance a billing date by one cycle (used when a subscription renews). */
export function advanceBilling(ms: number, cycle: BillingCycle): number {
  const d = new Date(ms);
  switch (cycle) {
    case "weekly":
      return addWeeks(d, 1).getTime();
    case "quarterly":
      return addMonths(d, 3).getTime();
    case "yearly":
      return addYears(d, 1).getTime();
    case "monthly":
    default:
      return addMonths(d, 1).getTime();
  }
}
