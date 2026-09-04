"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { where } from "firebase/firestore";
import { RenLogo } from "@/components/brand/RenLogo";
import { RenChat } from "@/components/finance/RenChat";
import { useScopedUserCollection } from "@/hooks/useScopedUserCollection";
import { useLocale } from "@/components/providers/LocaleProvider";
import { subscriptionMonthly } from "@/lib/accounts";
import type { Transaction, SavingsGoal, Payment, Subscription } from "@/lib/types";

/**
 * Ren, everywhere. A floating champagne orb present on every signed-in screen —
 * tap (or long-look) and Ren opens, already knowing your money. This is the
 * always-there assistant; it gathers the same real context the dashboard uses.
 */
export function RenLauncher() {
  const { prefs } = useLocale();
  const [open, setOpen] = useState(false);

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

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Ren, your finance assistant"
        className="fixed end-4 bottom-24 z-40 grid size-14 place-items-center rounded-full lg:bottom-6 lg:end-6"
        style={{ boxShadow: "0 10px 30px -6px var(--color-gold-500)" }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 24, delay: 0.2 }}
        whileHover={{ scale: 1.06, y: -2 }}
        whileTap={{ scale: 0.94 }}
      >
        <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-[var(--color-gold-400)]/30" style={{ animationDuration: "3s" }} />
        <RenLogo size={56} idSuffix="fab" className="relative" />
      </motion.button>

      <RenChat open={open} onClose={() => setOpen(false)} uid={uid} ctx={ctx} />
    </>
  );
}
