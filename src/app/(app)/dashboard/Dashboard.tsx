"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { orderBy, where, limit } from "firebase/firestore";
import {
  ArrowLeftRight, ArrowDownLeft, ArrowUpRight, PiggyBank, TrendingUp, ReceiptText, Plus, ChevronRight, Wallet, Landmark, ShieldCheck,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { AnimatedButton, AnimatedModal, StaggerContainer, StaggerItem } from "@/components/motion";
import { AnimatedAmount } from "@/components/finance/AnimatedAmount";
import { TransactionForm } from "@/components/finance/TransactionForm";
import { toast } from "@/components/ui/toast-store";
import { useUserCollection } from "@/hooks/useUserCollection";
import { createTransaction, type TransactionInput } from "@/lib/firestore/transactions";
import { monthRange } from "@/lib/finance";
import { computeAccountBalance, accountTypeMeta, subscriptionMonthly } from "@/lib/accounts";
import { computeInsights } from "@/lib/insights";
import { Insights } from "@/components/finance/Insights";
import { ConnectBankModal } from "@/components/bank/ConnectBankModal";
import { hasLinkedAccount } from "@/lib/bank/connect";
import { isOverdue } from "@/lib/dates";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useCategories } from "@/hooks/useCategories";
import { useAccountType } from "@/hooks/useAccountType";
import { cn } from "@/lib/utils";
import type { Transaction, SavingsGoal, Investment, Payment, Account, Transfer, Subscription } from "@/lib/types";

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

export function Dashboard({ firstName }: { firstName: string }) {
  const router = useRouter();
  const { prefs, money, dueLabel, date } = useLocale();
  const { resolve } = useCategories();
  const { isBusiness } = useAccountType();
  // Server renders the neutral "Hello"; the client swaps to the local-time
  // greeting on hydration (no mismatch, no setState-in-effect).
  const greeting = useSyncExternalStore(greetSubscribe, timeGreeting, () => "Hello");
  const txC = useMemo(() => [orderBy("date", "desc")], []);
  const recentC = useMemo(() => [orderBy("date", "desc"), limit(6)], []);
  const upcomingC = useMemo(() => [where("status", "in", ["upcoming", "overdue"])], []);

  const txAll = useUserCollection<Transaction>("transactions", txC);
  const recent = useUserCollection<Transaction>("transactions", recentC);
  const savings = useUserCollection<SavingsGoal>("savings");
  const investments = useUserCollection<Investment>("investments");
  const bills = useUserCollection<Payment>("payments", upcomingC);
  const accounts = useUserCollection<Account>("accounts");
  const transfers = useUserCollection<Transfer>("transfers");
  const subscriptions = useUserCollection<Subscription>("subscriptions");

  const [modalOpen, setModalOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const hasBank = useMemo(() => hasLinkedAccount(accounts.data), [accounts.data]);

  const loading = txAll.loading || savings.loading || investments.loading || bills.loading || accounts.loading || transfers.loading;
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

  const brandNew = !loading && txAll.data.length === 0 && savings.data.length === 0 && investments.data.length === 0 && bills.data.length === 0 && accounts.data.length === 0;

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
              <p className="text-muted text-sm capitalize">{date(new Date(), { weekday: "long", day: "numeric", month: "long" })}</p>
              <h1 className="text-strong mt-1 text-2xl font-light sm:text-3xl">{greeting}, {firstName}.</h1>
              <p className="text-muted mt-1 text-sm">Your money, automatically clear.</p>
            </div>
            <div className="flex items-center gap-2">
              {hasBank ? (
                <AnimatedButton onClick={() => router.push("/payments")}><ReceiptText className="size-4" />Pay a bill</AnimatedButton>
              ) : (
                <AnimatedButton onClick={() => setConnectOpen(true)}><Landmark className="size-4" />Connect bank</AnimatedButton>
              )}
              <AnimatedButton variant="glass" onClick={() => setModalOpen(true)}><Plus className="size-4" />Add</AnimatedButton>
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
                <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-[var(--glass-bg-strong)]"><Landmark className="size-7 text-[var(--color-gold-500)]" /></div>
                <h2 className="text-strong text-xl font-medium">Connect your bank — Renew does the rest</h2>
                <p className="text-muted mt-2 text-sm">No typing, no uploads. Connect once and Renew pulls in your balance, sorts every transaction, and tracks your bills and subscriptions — automatically.</p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                  <AnimatedButton size="lg" onClick={() => setConnectOpen(true)}><Landmark className="size-4" />Connect your bank</AnimatedButton>
                  <AnimatedButton size="lg" variant="glass" onClick={() => setModalOpen(true)}><Plus className="size-4" />Add manually</AnimatedButton>
                </div>
                <p className="text-muted mt-4 inline-flex items-center gap-1.5 text-xs"><ShieldCheck className="size-3.5 text-[var(--color-gold-500)]" />Bank-grade encryption · read-only · your data stays private</p>
              </div>
            </GlassCard>
          </StaggerItem>
        ) : (
          <>
            {!hasBank && (
              <StaggerItem>
                <button type="button" onClick={() => setConnectOpen(true)} className="group flex w-full items-center gap-4 rounded-glass-lg border border-[var(--glass-border)] bg-[var(--glass-bg-strong)] p-4 text-left backdrop-blur-md transition-colors hover:border-[var(--focus-ring)]/60">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--field-bg)]"><Landmark className="size-5 text-[var(--color-gold-500)]" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="text-strong block text-sm font-medium">Connect your bank for automatic tracking</span>
                    <span className="text-muted block text-xs">Stop typing transactions — let Renew sync and sort them for you.</span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5" />
                </button>
              </StaggerItem>
            )}
            {/* Hero balance */}
            <StaggerItem>
              <GlassCard padded className="relative overflow-hidden">
                <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-[radial-gradient(circle,var(--bokeh-1),transparent_70%)] blur-2xl" />
                <p className="text-muted text-sm">Net worth</p>
                <AnimatedAmount value={netWorth} currency={currency} className="text-strong mt-1 block text-4xl font-light tabular-nums sm:text-5xl" />
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Mini label={isBusiness ? "Revenue (mo)" : "This month in"} icon={ArrowDownLeft} value={totals.mIncome} currency={currency} tone="emerald" />
                  <Mini label={isBusiness ? "Expenses (mo)" : "This month out"} icon={ArrowUpRight} value={totals.mExpense} currency={currency} tone="rose" />
                  <Mini label="Coming up" icon={ReceiptText} value={comingTotal} currency={currency} />
                  <Mini label="Saved" icon={PiggyBank} value={savingsTotal} currency={currency} />
                </div>
              </GlassCard>
            </StaggerItem>

            {insights.length > 0 && (
              <StaggerItem>
                <Insights insights={insights} currency={currency} />
              </StaggerItem>
            )}

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
                            <span className={cn("text-sm font-medium tabular-nums", bal < 0 ? "text-rose-500" : "text-[var(--text-strong)]")}>{money(bal, a.currency)}</span>
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

      <ConnectBankModal
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        onConnected={(r) => toast({ title: `Synced ${r.transactions} transactions from your bank`, variant: "success" })}
      />
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
