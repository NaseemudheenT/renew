"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { orderBy, where, limit } from "firebase/firestore";
import {
  ArrowLeftRight, ArrowDownLeft, ArrowUpRight, PiggyBank, ReceiptText, Plus, ChevronRight, Wallet, ShieldCheck,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { AnimatedButton, AnimatedModal, StaggerContainer, StaggerItem } from "@/components/motion";
import { AnimatedAmount } from "@/components/finance/AnimatedAmount";
import { TransactionForm } from "@/components/finance/TransactionForm";
import { SpendingBreakdown } from "@/components/finance/SpendingBreakdown";
import { FinancialIntelligence } from "@/components/finance/FinancialIntelligence";
import { AskRenew } from "@/components/finance/AskRenew";
import { toast } from "@/components/ui/toast-store";
import { useScopedUserCollection } from "@/hooks/useScopedUserCollection";
import { useUserProfile } from "@/hooks/useUserProfile";
import { createTransaction, type TransactionInput } from "@/lib/firestore/transactions";
import { monthRange } from "@/lib/finance";
import { computeAccountBalance, accountTypeMeta, subscriptionMonthly } from "@/lib/accounts";
import { computeInsights } from "@/lib/insights";
import { Insights } from "@/components/finance/Insights";
import { usePrivacy } from "@/components/providers/PrivacyProvider";
import { isOverdue } from "@/lib/dates";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useCategories } from "@/hooks/useCategories";
import { useAccountType } from "@/hooks/useAccountType";
import { cn } from "@/lib/utils";
import type { Transaction, SavingsGoal, Payment, Account, Transfer, Subscription } from "@/lib/types";

/** A warm, time-of-day greeting — computed from the person's own clock. */
function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 22) return "Good evening";
  return "Good night";
}
const greetSubscribe = () => () => {};

/** Setup's "what matters most" choices → personalized home shortcuts. This is
 *  how the onboarding answers visibly shape each person's Renew. */
const FOCUS_SHORTCUTS: Record<string, { label: string; href: string; icon: typeof Wallet }> = {
  spending: { label: "Spending & budgets", href: "/budget", icon: Wallet },
  bills: { label: "Bills & subscriptions", href: "/payments", icon: ReceiptText },
  savings: { label: "Savings goals", href: "/savings", icon: PiggyBank },
};

export function Dashboard({ name }: { name: string }) {
  const router = useRouter();
  const { prefs, money, dueLabel, date } = useLocale();
  const { hidden: amountsHidden, mask } = usePrivacy();
  const { resolve } = useCategories();
  const { isBusiness } = useAccountType();
  const { profile } = useUserProfile();
  const focus = useMemo(() => (profile?.focus ?? []).filter((f) => f in FOCUS_SHORTCUTS), [profile?.focus]);
  // Server renders the neutral "Hello"; the client swaps to the local-time
  // greeting on hydration (no mismatch, no setState-in-effect).
  const greeting = useSyncExternalStore(greetSubscribe, timeGreeting, () => "Hello");
  const txC = useMemo(() => [orderBy("date", "desc")], []);
  const recentC = useMemo(() => [orderBy("date", "desc"), limit(6)], []);
  const upcomingC = useMemo(() => [where("status", "in", ["upcoming", "overdue"])], []);

  const txAll = useScopedUserCollection<Transaction>("transactions", txC);
  const recent = useScopedUserCollection<Transaction>("transactions", recentC);
  const savings = useScopedUserCollection<SavingsGoal>("savings");
  const bills = useScopedUserCollection<Payment>("payments", upcomingC);
  const accounts = useScopedUserCollection<Account>("accounts");
  const transfers = useScopedUserCollection<Transfer>("transfers");
  const subscriptions = useScopedUserCollection<Subscription>("subscriptions");

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loading = txAll.loading || savings.loading || bills.loading || accounts.loading || transfers.loading;
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
  const netWorth = totals.balance + savingsTotal;
  const upcomingBills = useMemo(() => [...bills.data].sort((a, b) => a.dueAt - b.dueAt).slice(0, 4), [bills.data]);
  const comingTotal = useMemo(() => bills.data.reduce((s, b) => s + b.amount, 0), [bills.data]);
  const recurring = useMemo(() => {
    const active = subscriptions.data.filter((s) => s.status === "active");
    return { monthly: active.reduce((sum, s) => sum + subscriptionMonthly(s), 0), count: active.length };
  }, [subscriptions.data]);
  const insights = useMemo(() => {
    const { end } = monthRange();
    const billsDueThisMonth = bills.data
      .filter((b) => b.status !== "paid" && b.dueAt < end)
      .reduce((s, b) => s + b.amount, 0);
    return computeInsights({
      transactions: txAll.data,
      recurringMonthly: recurring.monthly,
      activeSubs: recurring.count,
      upcomingBillsTotal: billsDueThisMonth,
    });
  }, [txAll.data, bills.data, recurring]);
  const activeAccounts = useMemo(() => accounts.data.filter((a) => a.status === "active"), [accounts.data]);
  const accountBalances = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of activeAccounts) m.set(a.id, computeAccountBalance(a, txAll.data, transfers.data));
    return m;
  }, [activeAccounts, txAll.data, transfers.data]);

  const brandNew = !loading && txAll.data.length === 0 && savings.data.length === 0 && bills.data.length === 0 && accounts.data.length === 0;

  async function addTransaction(input: TransactionInput): Promise<boolean> {
    if (!txAll.uid) return false;
    setSubmitting(true);
    try {
      await createTransaction(txAll.uid, input);
      toast({ title: "Transaction added", variant: "success" });
      return true;
    } catch {
      toast({ title: "Something went wrong", variant: "error" });
      return false;
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
              <p className="text-muted text-sm capitalize">{date(new Date(), { weekday: "long", day: "numeric", month: "long" })}</p>
              <h1 className="text-strong mt-1 text-2xl font-light sm:text-3xl">{greeting}, {name}.</h1>
            </div>
            <div className="flex items-center gap-2">
              <AnimatedButton onClick={() => setModalOpen(true)}><Plus className="size-4" />Add</AnimatedButton>
            </div>
          </div>
        </StaggerItem>

        {loading ? (
          <DashboardSkeleton />
        ) : brandNew ? (
          <StaggerItem>
            <GlassCard padded className="relative overflow-hidden text-center">
              <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-[radial-gradient(circle,var(--bokeh-1),transparent_70%)] blur-2xl" />
              <div className="mx-auto flex max-w-md flex-col items-center py-4">
                <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-[var(--glass-bg-strong)]"><Wallet className="size-7 text-[var(--color-gold-500)]" /></div>
                <h2 className="text-strong text-xl font-medium">Start tracking your money</h2>
                <p className="text-muted mt-2 text-sm">Add a transaction — by tap or voice — and set up the accounts your money lives in. Renew sorts each one, watches your bills, and shows you exactly where your money goes. Only real money, always.</p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                  <AnimatedButton size="lg" onClick={() => setModalOpen(true)}><Plus className="size-4" />Add a transaction</AnimatedButton>
                  <AnimatedButton size="lg" variant="glass" onClick={() => router.push("/accounts")}><Wallet className="size-4" />Add an account</AnimatedButton>
                </div>
                <p className="text-muted mt-4 inline-flex items-center gap-1.5 text-xs"><ShieldCheck className="size-3.5 text-[var(--color-gold-500)]" />Private &amp; secure · your data stays yours</p>
              </div>
            </GlassCard>
          </StaggerItem>
        ) : (
          <>
            {/* Hero balance */}
            <StaggerItem>
              <GlassCard padded className="relative overflow-hidden">
                <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-[radial-gradient(circle,var(--bokeh-1),transparent_70%)] blur-2xl" />
                <div className="pointer-events-none absolute -bottom-16 -left-12 size-44 rounded-full bg-[radial-gradient(circle,var(--bokeh-3),transparent_72%)] blur-3xl opacity-70" />
                <p className="text-muted text-sm">{isBusiness ? "Business net worth" : "Net worth"}</p>
                <AnimatedAmount value={netWorth} currency={currency} className="mt-1 block bg-gradient-to-br from-[var(--text-strong)] to-[var(--text-body)] bg-clip-text text-4xl font-light tabular-nums text-transparent sm:text-5xl" />
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Mini label={isBusiness ? "Revenue (mo)" : "This month in"} icon={ArrowDownLeft} value={totals.mIncome} currency={currency} tone="emerald" />
                  <Mini label={isBusiness ? "Expenses (mo)" : "This month out"} icon={ArrowUpRight} value={totals.mExpense} currency={currency} tone="rose" />
                  <Mini label="Coming up" icon={ReceiptText} value={comingTotal} currency={currency} />
                  <Mini label="Saved" icon={PiggyBank} value={savingsTotal} currency={currency} />
                </div>
              </GlassCard>
            </StaggerItem>

            {focus.length > 0 && (
              <StaggerItem>
                <div>
                  <p className="text-muted mb-2 px-1 text-xs font-medium uppercase tracking-wide">For you</p>
                  <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                    {focus.map((f) => {
                      const s = FOCUS_SHORTCUTS[f]!;
                      const Icon = s.icon;
                      return (
                        <Link key={f} href={s.href} className="glass text-body flex shrink-0 items-center gap-2 !rounded-full px-3.5 py-2 text-sm transition-colors hover:text-[var(--text-strong)]">
                          <Icon className="size-4 text-[var(--color-gold-500)]" />{s.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </StaggerItem>
            )}

            <StaggerItem>
              <AskRenew transactions={txAll.data} netWorth={netWorth} monthlySubs={recurring.monthly} activeSubs={recurring.count} upcomingBillsTotal={comingTotal} currency={currency} />
            </StaggerItem>

            {insights.length > 0 && (
              <StaggerItem>
                <Insights insights={insights} currency={currency} />
              </StaggerItem>
            )}

            <StaggerItem>
              <FinancialIntelligence transactions={txAll.data} currency={currency} hideTrend max={3} />
            </StaggerItem>

            <StaggerItem>
              <SpendingBreakdown transactions={txAll.data} currency={currency} />
            </StaggerItem>

            {activeAccounts.length > 0 && (
              <StaggerItem>
                <GlassCard padded>
                  <Heading title="Accounts" href="/accounts" />
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {activeAccounts.slice(0, 6).map((a) => {
                      const meta = accountTypeMeta(a.atype);
                      const AIcon = meta.icon;
                      const bal = accountBalances.get(a.id) ?? 0;
                      return (
                        <li key={a.id}>
                          <Link href="/accounts" className="flex items-center gap-3 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-2.5 transition-colors hover:border-[var(--focus-ring)]/50">
                            <AIcon className="size-4 shrink-0 text-[var(--color-gold-500)]" />
                            <span className="text-body min-w-0 flex-1 truncate text-sm">{a.name}</span>
                            <span className={cn("text-sm font-medium tabular-nums", bal < 0 ? "text-rose-500" : "text-[var(--text-strong)]")}>{amountsHidden ? mask : money(bal, a.currency)}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </GlassCard>
              </StaggerItem>
            )}

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
                        const meta = resolve(t.category);
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
                              <span className={cn("w-16 text-end text-xs", overdue ? "text-rose-500" : "text-[var(--text-muted)]")}>{dueLabel(b.dueAt)}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </GlassCard>
              </StaggerItem>
            </div>
          </>
        )}
      </StaggerContainer>

      <AnimatedModal open={modalOpen} onClose={() => setModalOpen(false)} title="Add transaction">
        <TransactionForm defaultCurrency={currency} submitting={submitting} onSubmit={async (i) => { if (await addTransaction(i)) setModalOpen(false); }} onCancel={() => setModalOpen(false)} />
      </AnimatedModal>

    </div>
  );
}

/** Elegant loading state — shimmer that mirrors the real layout, so numbers
 *  fade in instead of flashing zeros. */
function DashboardSkeleton() {
  return (
    <>
      <StaggerItem>
        <GlassCard padded className="relative overflow-hidden">
          <Skeleton className="h-3.5 w-24 rounded-md" />
          <Skeleton className="mt-3 h-11 w-56 rounded-lg" />
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] p-3">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="mt-2 h-5 w-20 rounded-md" />
              </div>
            ))}
          </div>
        </GlassCard>
      </StaggerItem>
      <div className="grid gap-6 lg:grid-cols-2">
        {[0, 1].map((c) => (
          <StaggerItem key={c}>
            <GlassCard padded className="h-full">
              <Skeleton className="h-4 w-28 rounded-md" />
              <div className="mt-4 flex flex-col gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-11 w-full rounded-2xl" />
                ))}
              </div>
            </GlassCard>
          </StaggerItem>
        ))}
      </div>
    </>
  );
}

function Mini({ label, icon: Icon, value, currency, tone }: { label: string; icon: typeof Wallet; value: number; currency: string; tone?: "emerald" | "rose" }) {
  return (
    <div className={cn(
      "rounded-2xl border p-3 transition-colors",
      tone === "emerald" ? "border-emerald-500/20 bg-emerald-500/[0.07]" : tone === "rose" ? "border-rose-500/20 bg-rose-500/[0.07]" : "border-[var(--field-border)] bg-[var(--field-bg)]",
    )}>
      <div className="text-muted flex items-center gap-1.5 text-xs">
        <span className={cn(
          "grid size-5 shrink-0 place-items-center rounded-md",
          tone === "emerald" ? "bg-emerald-500/15 text-emerald-400" : tone === "rose" ? "bg-rose-500/15 text-rose-400" : "bg-[var(--glass-bg-strong)] text-[var(--color-gold-500)]",
        )}><Icon className="size-3" /></span>
        <span className="truncate">{label}</span>
      </div>
      <AnimatedAmount value={value} currency={currency} className={cn("mt-1.5 block text-lg font-semibold tabular-nums", tone === "emerald" ? "text-emerald-500" : tone === "rose" ? "text-rose-500" : "text-[var(--text-strong)]")} />
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
