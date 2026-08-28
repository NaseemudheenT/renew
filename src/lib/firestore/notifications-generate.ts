"use client";

import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { format } from "date-fns";
import { userCollection } from "@/lib/firestore/db";
import { todayEnd, daysUntil } from "@/lib/dates";
import { resolveCatMeta, monthRange } from "@/lib/finance";
import { anomalies } from "@/lib/intelligence";
import { translate } from "@/lib/i18n/messages";
import type {
  Reminder,
  Task,
  Payment,
  DocItem,
  Budget,
  SavingsGoal,
  Transaction,
  Subscription,
  CustomCategory,
  AppNotification,
  NotificationType,
} from "@/lib/types";

interface Desired {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string;
  sourceId: string;
}

function dayKey(ms: number): string {
  return format(new Date(ms), "yyyy-MM-dd");
}

/**
 * Derive the notifications that SHOULD exist right now from the user's real
 * data. Deterministic ids (type_source_day) make this idempotent — the same
 * situation never produces a duplicate, and read state is never reset.
 */
export interface NotificationPrefsInput {
  reminders: boolean;
  tasks: boolean;
  payments: boolean;
  documents: boolean;
  budgets: boolean;
  savings: boolean;
}

export function computeDesired(
  input: {
    reminders: Reminder[];
    tasks: Task[];
    payments: Payment[];
    documents: DocItem[];
    budgets?: Budget[];
    savings?: SavingsGoal[];
    transactions?: Transaction[];
    subscriptions?: Subscription[];
    customCategories?: CustomCategory[];
  },
  prefs: NotificationPrefsInput = {
    reminders: true,
    tasks: true,
    payments: true,
    documents: true,
    budgets: true,
    savings: true,
  },
  language = "en",
): Desired[] {
  const out: Desired[] = [];
  const end = todayEnd();
  const monthKey = dayKey(monthRange().start).slice(0, 7); // yyyy-MM
  const tr = (key: Parameters<typeof translate>[1], vars?: Record<string, string | number>) =>
    translate(language, key, vars);

  if (prefs.reminders) {
    for (const r of input.reminders) {
      if (r.completed) continue;
      if (r.dueAt <= end) {
        const overdue = r.dueAt < Date.now();
        out.push({
          id: `reminder_${r.id}_${dayKey(r.dueAt)}`,
          type: "reminder",
          title: tr(overdue ? "notif.reminder.overdue" : "notif.reminder.due"),
          body: r.title,
          href: "/reminders",
          sourceId: r.id,
        });
      }
    }
  }

  if (prefs.tasks) {
    for (const t of input.tasks) {
      if (t.completed || t.dueAt == null) continue;
      if (t.dueAt <= end) {
        const overdue = t.dueAt < Date.now();
        out.push({
          id: `task_${t.id}_${dayKey(t.dueAt)}`,
          type: "task",
          title: tr(overdue ? "notif.task.overdue" : "notif.task.due"),
          body: t.title,
          href: "/tasks",
          sourceId: t.id,
        });
      }
    }
  }

  if (prefs.payments) {
    for (const p of input.payments) {
      if (p.status === "paid") continue;
      const d = daysUntil(p.dueAt);
      // Honour the per-bill reminder lead time (default 3 days); overdue always fires.
      const lead = typeof p.remindDaysBefore === "number" ? p.remindDaysBefore : 3;
      if (d <= lead) {
        out.push({
          id: `payment_${p.id}_${dayKey(p.dueAt)}`,
          type: "payment",
          title: tr(d < 0 ? "notif.payment.overdue" : "notif.payment.due"),
          body: p.name,
          href: "/payments",
          sourceId: p.id,
        });
      }
    }
  }

  if (prefs.documents) {
    for (const doc of input.documents) {
      if (doc.expiresAt == null) continue;
      const d = daysUntil(doc.expiresAt);
      if (d <= 30 && d >= -1) {
        out.push({
          id: `document_${doc.id}_${dayKey(doc.expiresAt)}`,
          type: "document",
          title: tr(d < 0 ? "notif.document.overdue" : "notif.document.due"),
          body: doc.name,
          href: "/documents",
          sourceId: doc.id,
        });
      }
    }
  }

  // Budget warnings — spend for this month vs. each category's limit.
  if (prefs.budgets && input.budgets?.length && input.transactions) {
    const { start, end: monthEnd } = monthRange();
    // Key spend by category AND currency so budgets are only compared against
    // spend in the same currency (never sum mixed currencies as raw numbers).
    const spent = new Map<string, number>();
    for (const t of input.transactions) {
      if (t.type === "expense" && t.date >= start && t.date < monthEnd) {
        const key = `${t.category}|${t.currency}`;
        spent.set(key, (spent.get(key) ?? 0) + t.amount);
      }
    }
    for (const b of input.budgets) {
      if (b.amount <= 0) continue;
      const used = spent.get(`${b.category}|${b.currency}`) ?? 0;
      const ratio = used / b.amount;
      const label = resolveCatMeta(b.category, input.customCategories ?? []).label;
      if (ratio >= 1) {
        out.push({
          id: `budget_over_${b.id}_${monthKey}`,
          type: "budget",
          title: tr("notif.budget.over.title"),
          body: tr("notif.budget.over.body", { category: label }),
          href: "/budget",
          sourceId: b.id,
        });
      } else if (ratio >= 0.9) {
        out.push({
          id: `budget_warn_${b.id}_${monthKey}`,
          type: "budget",
          title: tr("notif.budget.warn.title"),
          body: tr("notif.budget.warn.body", { percent: Math.round(ratio * 100), category: label }),
          href: "/budget",
          sourceId: b.id,
        });
      }
    }
  }

  // Subscription renewals — active subs billing within 3 days.
  if (prefs.payments && input.subscriptions?.length) {
    for (const s of input.subscriptions) {
      if (s.status !== "active") continue;
      const d = daysUntil(s.nextBillingAt);
      if (d <= 3 && d >= 0) {
        out.push({
          id: `subscription_${s.id}_${dayKey(s.nextBillingAt)}`,
          type: "subscription",
          title: tr("notif.subscription.due"),
          body: s.name,
          href: "/subscriptions",
          sourceId: s.id,
        });
      }
    }
  }

  // Savings milestones — a goal reaching its target.
  if (prefs.savings && input.savings?.length) {
    for (const g of input.savings) {
      if (g.target > 0 && g.current >= g.target) {
        out.push({
          id: `savings_reached_${g.id}`,
          type: "savings",
          title: tr("notif.savings.reached.title"),
          body: tr("notif.savings.reached.body", { name: g.name }),
          href: "/savings",
          sourceId: g.id,
        });
      }
    }
  }

  // Proactive spending anomalies (§22): a category unusually high vs its own
  // recent average. One per category per month; needs real history to fire.
  if (prefs.budgets && input.transactions?.length) {
    for (const a of anomalies(input.transactions, undefined, { minPct: 25 }).slice(0, 2)) {
      const label = resolveCatMeta(a.category, input.customCategories ?? []).label;
      out.push({
        id: `anomaly_${a.category}_${monthKey}`,
        type: "budget",
        title: `${label} is ${a.pct}% above your usual`,
        body: `You're spending more on ${label.toLowerCase()} this month than your recent average.`,
        href: "/analytics",
        sourceId: a.category,
      });
    }
  }

  return out;
}

/** Create any desired notifications that don't already exist. */
export async function createMissingNotifications(
  uid: string,
  desired: Desired[],
  existing: AppNotification[],
): Promise<void> {
  const existingIds = new Set(existing.map((n) => n.id));
  const toCreate = desired.filter((d) => !existingIds.has(d.id));
  await Promise.all(
    toCreate.map((d) =>
      setDoc(
        doc(userCollection(uid, "notifications"), d.id),
        {
          type: d.type,
          title: d.title,
          body: d.body,
          href: d.href,
          sourceId: d.sourceId,
          read: false,
          createdAt: serverTimestamp(),
        },
        { merge: false },
      ),
    ),
  );
}
