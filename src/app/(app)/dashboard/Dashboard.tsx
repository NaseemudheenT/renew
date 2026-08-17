"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { orderBy, where, limit } from "firebase/firestore";
import {
  ArrowLeftRight, ArrowDownLeft, ArrowUpRight, PiggyBank, TrendingUp, ReceiptText, Plus, ChevronRight, Wallet, Sparkles,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { AnimatedButton, AnimatedModal, StaggerContainer, StaggerItem } from "@/components/motion";
import { AnimatedAmount } from "@/components/finance/AnimatedAmount";
import { TransactionForm } from "@/components/finance/TransactionForm";
import { toast } from "@/components/ui/toast-store";
import { useUserCollection } from "@/hooks/useUserCollection";
import { createTransaction, type TransactionInput } from "@/lib/firestore/transactions";
import { catMeta, monthRange } from "@/lib/finance";
import { dueLabel, isOverdue } from "@/lib/dates";
import { useLocale } from "@/components/providers/LocaleProvider";
import { cn } from "@/lib/utils";
import type { Transaction, SavingsGoal, Investment, Payment } from "@/lib/types";

export function Dashboard({ firstName }: { firstName: string }) {
  const { prefs, money } = useLocale();
  const txC = useMemo(() => [orderBy("date", "desc")], []);
  const recentC = useMemo(() => [orderBy("date", "desc"), limit(6)], []);
  const upcomingC = useMemo(() => [where("status", "in", ["upcoming", "overdue"])], []);

  const txAll = useUserCollection<Transaction>("transactions", txC);
  const recent = useUserCollection<Transaction>("transactions", recentC);
  const savings = useUserCollection<SavingsGoal>("savings");
  const investments = useUserCollection<Investment>("investments");
  const bills = useUserCollection<Payment>("payments", upcomingC);

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loading = txAll.loading || savings.loading || investments.loading || bills.loading;
  const currency = txAll.data[0]?.currency ?? savings.data[0]?.currency ?? prefs.currency;

  const totals = useMemo(() => {
    let income = 0, expense = 0, mIncome = 0, mExpense = 0;
    const { start, end } = monthRange();
    for (const t of txAll.data) {
      if (t.type === "income") { income += t.amount; if (t.date >= start && t.date < end) mIncome += t.amount; }
      else { expense += t.amount; if (t.date >= start && t.date < end) mExpense += t.amount; }
    }
    return { balance: income - expense, income, expense, mIncome, mExpense };
  }, [txAll.data]);

  const savingsTotal = useMemo(() => savings.data.reduce((s, g) => s + g.current, 0), [savings.data]);
  const invValue = useMemo(() => investments.data.reduce((s, i) => s + i.quantity * i.currentPrice, 0), [investments.data]);
  const invCost = useMemo(() => investments.data.reduce((s, i) => s + i.quantity * i.buyPrice, 0), [investments.data]);
  const invGain = invValue - invCost;
  const netWorth = totals.balance + savingsTotal + invValue;
  const upcomingBills = useMemo(() => [...bills.data].sort((a, b) => a.dueAt - b.dueAt).slice(0, 4), [bills.data]);

  const brandNew = !loading && txAll.data.length === 0 && savings.data.length === 0 && investments.data.length === 0 && bills.data.length === 0;

  async function quickAdd(input: TransactionInput) {
    if (!txAll.uid) return;
    setSubmitting(true);
    try {
      await createTransaction(txAll.uid, input);
      toast({ title: "Transaction added", variant: "success" });
      setModalOpen(false);
    } catch {
      toast({ title: "Something went wrong", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <StaggerContainer className="flex flex-col gap-6" stagger={0.07}>
        <StaggerItem>
          <div className="flex flex-wrap items-end justify-between gap-3 pt-2">
            <div>
              <p className="text-muted text-sm">{new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</p>
              <h1 className="text-strong mt-1 text-2xl font-light sm:text-3xl">Hello, {firstName}.</h1>
            </div>
            <AnimatedButton onClick={() => setModalOpen(true)}><Plus className="size-4" />Add transaction</AnimatedButton>
          </div>
        </StaggerItem>

        {brandNew ? (
          <StaggerItem>
            <GlassCard padded>
              <EmptyState icon={Sparkles} title="Welcome to your money, at a glance" description="Add your first income or expense and Renew instantly shows your balance, spending and what's coming next." action={<AnimatedButton size="lg" onClick={() => setModalOpen(true)}><Plus className="size-4" />Add your first transaction</AnimatedButton>} />
            </GlassCard>
          </StaggerItem>
        ) : (
          <>
            {/* Hero balance */}
            <StaggerItem>
              <GlassCard padded className="relative overflow-hidden">
                <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-[radial-gradient(circle,var(--bokeh-1),transparent_70%)] blur-2xl" />
                <p className="text-muted text-sm">Net worth</p>
                <AnimatedAmount value={netWorth} currency={currency} className="text-strong mt-1 block text-4xl font-light tabular-nums sm:text-5xl" />
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Mini label="Balance" icon={Wallet} value={totals.balance} currency={currency} />
                  <Mini label="This month in" icon={ArrowDownLeft} value={totals.mIncome} currency={currency} tone="emerald" />
                  <Mini label="This month out" icon={ArrowUpRight} value={totals.mExpense} currency={currency} tone="rose" />
                  <Mini label="Saved" icon={PiggyBank} value={savingsTotal} currency={currency} />
                </div>
              </GlassCard>
            </StaggerItem>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Recent transactions */}
              <StaggerItem>
                <GlassCard padded className="h-full">
                  <Heading title="Recent" href="/transactions" />
                  {recent.data.length === 0 ? (
                    <EmptyState compact icon={ArrowLeftRight} title="No transactions yet" />
                  ) : (
                    <ul className="mt-3 flex flex-col gap-2">
                      {recent.data.map((t) => {
                        const meta = catMeta(t.category);
                        const Icon = meta.icon;
                        const income = t.type === "income";
                        return (
                          <li key={t.id}>
                            <Link href="/transactions" className="flex items-center gap-3 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-2.5 transition-colors hover:border-[var(--focus-ring)]/50">
                              <Icon className={cn("size-4 shrink-0", income ? "text-emerald-400" : "text-rose-400")} />
                              <span className="text-body min-w-0 flex-1 truncate text-sm">{t.note || meta.label}</span>
                              <span className={cn("text-sm font-medium tabular-nums", income ? "text-emerald-500" : "text-rose-500")}>{income ? "+" : "−"}{money(t.amount, t.currency)}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </GlassCard>
              </StaggerItem>

              {/* Upcoming bills */}
              <StaggerItem>
                <GlassCard padded className="h-full">
                  <Heading title="Upcoming bills" href="/payments" />
                  {upcomingBills.length === 0 ? (
                    <EmptyState compact icon={ReceiptText} title="No bills due" />
                  ) : (
                    <ul className="mt-3 flex flex-col gap-2">
                      {upcomingBills.map((b) => {
                        const overdue = b.status === "overdue" || isOverdue(b.dueAt);
                        return (
                          <li key={b.id}>
                            <Link href="/payments" className="flex items-center gap-3 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-2.5 transition-colors hover:border-[var(--focus-ring)]/50">
                              <span className="text-body min-w-0 flex-1 truncate text-sm">{b.name}</span>
                              <span className="text-strong text-sm font-medium tabular-nums">{money(b.amount, b.currency)}</span>
                              <span className={cn("w-16 text-right text-xs", overdue ? "text-rose-500" : "text-[var(--text-muted)]")}>{dueLabel(b.dueAt)}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </GlassCard>
              </StaggerItem>

              {/* Investments */}
              <StaggerItem className="lg:col-span-2">
                <GlassCard padded>
                  <Heading title="Investments" href="/investments" />
                  {investments.data.length === 0 ? (
                    <EmptyState compact icon={TrendingUp} title="No investments tracked" />
                  ) : (
                    <div className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-3">
                      <div><p className="text-muted text-xs">Value</p><p className="text-strong text-xl font-medium tabular-nums">{money(invValue, currency)}</p></div>
                      <div><p className="text-muted text-xs">Invested</p><p className="text-body text-xl font-medium tabular-nums">{money(invCost, currency)}</p></div>
                      <div><p className="text-muted text-xs">Gain / loss</p><p className={cn("text-xl font-medium tabular-nums", invGain >= 0 ? "text-emerald-500" : "text-rose-500")}>{invGain >= 0 ? "+" : "−"}{money(Math.abs(invGain), currency)}</p></div>
                    </div>
                  )}
                </GlassCard>
              </StaggerItem>
            </div>
          </>
        )}
      </StaggerContainer>

      <AnimatedModal open={modalOpen} onClose={() => setModalOpen(false)} title="Add transaction">
        <TransactionForm defaultCurrency={currency} submitting={submitting} onSubmit={quickAdd} onCancel={() => setModalOpen(false)} />
      </AnimatedModal>
    </div>
  );
}

function Mini({ label, icon: Icon, value, currency, tone }: { label: string; icon: typeof Wallet; value: number; currency: string; tone?: "emerald" | "rose" }) {
  return (
    <div className="rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] p-3">
      <div className="text-muted flex items-center gap-1.5 text-xs"><Icon className={cn("size-3.5", tone === "emerald" && "text-emerald-400", tone === "rose" && "text-rose-400")} />{label}</div>
      <AnimatedAmount value={value} currency={currency} className={cn("mt-1 block text-lg font-medium tabular-nums", tone === "emerald" ? "text-emerald-500" : tone === "rose" ? "text-rose-500" : "text-[var(--text-strong)]")} />
    </div>
  );
}

function Heading({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-strong text-sm font-medium">{title}</h2>
      <Link href={href} className="text-muted flex items-center gap-0.5 text-xs hover:text-[var(--text-strong)]">View all<ChevronRight className="size-3.5" /></Link>
    </div>
  );
}
