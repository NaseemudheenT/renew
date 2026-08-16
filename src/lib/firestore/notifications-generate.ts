"use client";

import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { format } from "date-fns";
import { userCollection } from "@/lib/firestore/db";
import { todayEnd, daysUntil } from "@/lib/dates";
import type {
  Reminder,
  Task,
  Payment,
  DocItem,
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
}

export function computeDesired(
  input: {
    reminders: Reminder[];
    tasks: Task[];
    payments: Payment[];
    documents: DocItem[];
  },
  prefs: NotificationPrefsInput = {
    reminders: true,
    tasks: true,
    payments: true,
    documents: true,
  },
): Desired[] {
  const out: Desired[] = [];
  const end = todayEnd();

  if (prefs.reminders) {
    for (const r of input.reminders) {
      if (r.completed) continue;
      if (r.dueAt <= end) {
        const overdue = r.dueAt < Date.now();
        out.push({
          id: `reminder_${r.id}_${dayKey(r.dueAt)}`,
          type: "reminder",
          title: overdue ? "Reminder overdue" : "Reminder due today",
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
          title: overdue ? "Task overdue" : "Task due today",
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
      if (d <= 3) {
        out.push({
          id: `payment_${p.id}_${dayKey(p.dueAt)}`,
          type: "payment",
          title: d < 0 ? "Payment overdue" : "Payment due soon",
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
          title: d < 0 ? "Document expired" : "Document expiring soon",
          body: doc.name,
          href: "/documents",
          sourceId: doc.id,
        });
      }
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
