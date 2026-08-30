"use client";

import { useMemo, type ReactNode } from "react";
import Link from "next/link";
import {
  Sparkles, AlertTriangle, CalendarClock, TrendingUp, TrendingDown, Target,
  RefreshCw, ShoppingBag, PiggyBank, Trophy, ArrowDownLeft, ChevronRight, type LucideIcon,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { StaggerContainer, StaggerItem } from "@/components/motion";
import { suggestions, type Suggestion, type Severity } from "@/lib/advisor";
import { useCategories } from "@/hooks/useCategories";
import { useLocale } from "@/components/providers/LocaleProvider";
import { cn } from "@/lib/utils";
import type { Transaction, Subscription, Payment, Budget, SavingsGoal } from "@/lib/types";

/**
 * The Advisor — Renew's suggestion service, in plain language. It renders the
 * deterministic recommendations from lib/advisor: concrete, correct, tappable
 * next steps built from the person's own money. Every amount is real; nothing
 * is invented.
 */
export function Advisor({
  transactions, subscriptions, bills, budgets, goals, currency, max, title = "Suggestions",
}: {
  transactions: Transaction[];
  subscriptions?: Subscription[];
  bills?: Payment[];
  budgets?: Budget[];
  goals?: SavingsGoal[];
  currency: string;
  max?: number;
  title?: string;
}) {
  const { money } = useLocale();
  const { resolve } = useCategories();

  const items = useMemo(
    () => suggestions({ transactions, subscriptions, bills, budgets, goals, max }),
    [transactions, subscriptions, bills, budgets, goals, max],
  );

  if (items.length === 0) return null;

  function render(s: Suggestion): { icon: LucideIcon; text: ReactNode } {
    const m = (v?: number) => money(v ?? 0, currency);
    const cat = (id?: string) => resolve(id ?? "").label;
    const inDays = (d?: number) => (d && d > 0 ? `in ${d} day${d === 1 ? "" : "s"}` : "today");
    switch (s.kind) {
      case "overdue_bill":
        return {
          icon: AlertTriangle,
          text: s.count && s.count > 1
            ? <><strong className="text-strong">{s.count} bills are overdue</strong> — {m(s.amount)} in total. Clear them to avoid late fees.</>
            : <><strong className="text-strong">{s.name ?? "A bill"}</strong> is overdue — <strong className="text-rose-500">{m(s.amount)}</strong>. Pay it to avoid a late fee.</>,
        };
      case "bill_due_soon":
        return { icon: CalendarClock, text: <><strong className="text-strong">{s.name}</strong> is due {inDays(s.days)} — <strong className="text-strong">{m(s.amount)}</strong>.</> };
      case "negative_cashflow":
        return { icon: TrendingDown, text: <>At this pace you&apos;ll spend about <strong className="text-rose-500">{m(s.amount)}</strong> this month — more than your usual income of {m(s.amount2)}.</> };
      case "overspend_pace":
        return { icon: TrendingUp, text: <>On track to spend <strong className="text-strong">{m(s.amount)}</strong> this month, <strong className="text-amber-500">{s.pct}% above</strong> your usual. Easing off keeps you on track.</> };
      case "over_budget":
        return { icon: Target, text: <>You&apos;re over your <strong className="text-strong">{cat(s.category)}</strong> budget — {m(s.amount)} of {m(s.amount2)} (<strong className="text-amber-500">{s.pct}% over</strong>).</> };
      case "no_budget":
        return { icon: Target, text: <><strong className="text-strong">{cat(s.category)}</strong> costs about {m(s.amount)}/mo with no budget. Setting one keeps it in check.</> };
      case "category_spike":
        return { icon: TrendingUp, text: <><strong className="text-strong">{cat(s.category)}</strong> is {m(s.amount)} this month — <strong className="text-amber-500">{s.pct}% above</strong> your usual {m(s.amount2)}.</> };
      case "subscription_renewing":
        return { icon: RefreshCw, text: <><strong className="text-strong">{s.name}</strong> renews {inDays(s.days)} — {m(s.amount)}. Cancel now if you don&apos;t use it.</> };
      case "subscription_review":
        return { icon: RefreshCw, text: <><strong className="text-strong">{s.count} subscriptions</strong> cost {m(s.amount)}/mo — <strong className="text-strong">{m(s.amount2)}/yr</strong>. Cancel any you don&apos;t use.</> };
      case "high_wants":
        return { icon: ShoppingBag, text: <>Most of this month&apos;s spending is wants — <strong className="text-strong">{m(s.amount)}</strong> vs {m(s.amount2)} on essentials.</> };
      case "save_surplus":
        return { icon: PiggyBank, text: s.name
          ? <>On track to have about <strong className="text-emerald-500">{m(s.amount)}</strong> spare this month — move it to &lsquo;{s.name}&rsquo; before it&apos;s spent.</>
          : <>On track to have about <strong className="text-emerald-500">{m(s.amount)}</strong> spare this month. Put it toward a savings goal.</> };
      case "goal_reached":
        return { icon: Trophy, text: <>You reached <strong className="text-strong">&lsquo;{s.name}&rsquo;</strong> — {m(s.amount)} saved. 🎉</> };
      case "goal_pace":
        return { icon: PiggyBank, text: s.count != null
          ? <><strong className="text-strong">&lsquo;{s.name}&rsquo;</strong> is {s.pct}% funded — about {s.count} month{s.count === 1 ? "" : "s"} to go at your pace.</>
          : <><strong className="text-strong">&lsquo;{s.name}&rsquo;</strong> is {s.pct}% funded — {m(s.amount)} of {m(s.amount2)}.</> };
      case "add_income":
        return { icon: ArrowDownLeft, text: <>Add your income so Renew can show what&apos;s <strong className="text-strong">safe to spend</strong>.</> };
      case "spending_down":
        return { icon: TrendingDown, text: <>You&apos;ve spent <strong className="text-emerald-500">{s.pct}% less</strong> than last month — nice work.</> };
      case "healthy_savings":
        return { icon: Sparkles, text: <>You&apos;re saving <strong className="text-emerald-500">{s.pct}%</strong> of your income this month — {m(s.amount)} kept. Great pace.</> };
    }
  }

  return (
    <GlassCard padded>
      <div className="mb-4 flex items-center gap-2.5">
        <Sparkles className="size-5 text-[var(--color-gold-500)]" />
        <h2 className="text-strong text-base font-medium">{title}</h2>
      </div>
      <StaggerContainer className="flex flex-col gap-2.5" stagger={0.06}>
        {items.map((s) => {
          const { icon, text } = render(s);
          const body = <Row icon={icon} severity={s.severity} text={text} action={!!s.action} />;
          return (
            <StaggerItem key={s.id}>
              {s.action ? (
                <Link href={s.action.href} aria-label={s.action.label} className="block">{body}</Link>
              ) : body}
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </GlassCard>
  );
}

const TONE: Record<Severity, string> = {
  urgent: "text-rose-500 bg-rose-500/10",
  opportunity: "text-[var(--color-gold-500)] bg-[var(--color-gold-500)]/10",
  info: "text-sky-500 bg-sky-500/10",
  good: "text-emerald-500 bg-emerald-500/10",
};

function Row({
  icon: Icon, severity, text, action,
}: { icon: LucideIcon; severity: Severity; text: ReactNode; action: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-3 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] p-3.5",
      action && "transition-colors hover:border-[var(--focus-ring)]/50 hover:bg-[var(--glass-bg-soft)]",
    )}>
      <span className={cn("grid size-8 shrink-0 place-items-center rounded-xl", TONE[severity])}><Icon className="size-4" /></span>
      <p className="text-body min-w-0 flex-1 text-sm leading-relaxed">{text}</p>
      {action && <ChevronRight className="size-4 shrink-0 text-[var(--text-muted)]" />}
    </div>
  );
}
