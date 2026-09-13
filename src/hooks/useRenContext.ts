"use client";

import { useMemo } from "react";
import { where } from "firebase/firestore";
import { useScopedUserCollection } from "@/hooks/useScopedUserCollection";
import { useLocale } from "@/components/providers/LocaleProvider";
import { subscriptionMonthly } from "@/lib/accounts";
import type { AskContext } from "@/lib/ask";
import type { Transaction, SavingsGoal, Payment, Subscription } from "@/lib/types";

/**
 * The live money context Ren reasons over — the same real numbers the dashboard
 * shows. Shared by every Ren surface (the voice orb AND the full chat in
 * Settings) so they always see the same finances. Returns the context plus the
 * signed-in uid (null when signed out).
 */
export function useRenContext(): { ctx: Omit<AskContext, "now">; uid: string | null } {
  const { prefs } = useLocale();

  const billsQ = useMemo(() => [where("status", "in", ["upcoming", "overdue"])], []);
  const txAll = useScopedUserCollection<Transaction>("transactions");
  const savings = useScopedUserCollection<SavingsGoal>("savings");
  const bills = useScopedUserCollection<Payment>("payments", billsQ);
  const subscriptions = useScopedUserCollection<Subscription>("subscriptions");
  const uid = txAll.uid;

  const currency = txAll.data[0]?.currency ?? savings.data[0]?.currency ?? prefs.currency;

  const ctx = useMemo(() => {
    let income = 0, expense = 0;
    for (const t of txAll.data) t.type === "income" ? (income += t.amount) : (expense += t.amount);
    const savingsTotal = savings.data.reduce((s, g) => s + g.current, 0);
    const netWorth = income - expense + savingsTotal;
    const active = subscriptions.data.filter((s) => s.status === "active");
    const monthlySubs = active.reduce((sum, s) => sum + subscriptionMonthly(s), 0);
    const upcomingBillsTotal = bills.data.reduce((s, b) => s + b.amount, 0);
    return { transactions: txAll.data, netWorth, monthlySubs, activeSubs: active.length, upcomingBillsTotal, currency };
  }, [txAll.data, savings.data, subscriptions.data, bills.data, currency]);

  return { ctx, uid };
}
