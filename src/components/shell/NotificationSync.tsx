"use client";

import { useEffect, useMemo, useRef } from "react";
import { orderBy, limit } from "firebase/firestore";
import { useUserCollection } from "@/hooks/useUserCollection";
import {
  computeDesired,
  createMissingNotifications,
} from "@/lib/firestore/notifications-generate";
import type {
  Reminder,
  Task,
  Payment,
  DocItem,
  AppNotification,
} from "@/lib/types";

/**
 * Invisible worker mounted in the shell. It derives the notifications that
 * should exist from the user's real data (due/overdue/expiring items) and
 * creates any that are missing. Deterministic ids keep it idempotent, so it
 * never duplicates or resets read state. Runs whenever the source data changes.
 */
export function NotificationSync() {
  const reminders = useUserCollection<Reminder>("reminders");
  const tasks = useUserCollection<Task>("tasks");
  const payments = useUserCollection<Payment>("payments");
  const documents = useUserCollection<DocItem>("documents");
  const notifConstraints = useMemo(
    () => [orderBy("createdAt", "desc"), limit(100)],
    [],
  );
  const notifications = useUserCollection<AppNotification>(
    "notifications",
    notifConstraints,
  );

  const attempted = useRef<Set<string>>(new Set());

  const anyLoading =
    reminders.loading ||
    tasks.loading ||
    payments.loading ||
    documents.loading ||
    notifications.loading;

  useEffect(() => {
    const uid = reminders.uid;
    if (!uid || anyLoading) return;

    const desired = computeDesired({
      reminders: reminders.data,
      tasks: tasks.data,
      payments: payments.data,
      documents: documents.data,
    });

    // Skip ids already present or already attempted this session.
    const existingIds = new Set(notifications.data.map((n) => n.id));
    const toCreate = desired.filter(
      (d) => !existingIds.has(d.id) && !attempted.current.has(d.id),
    );
    if (toCreate.length === 0) return;
    toCreate.forEach((d) => attempted.current.add(d.id));

    void createMissingNotifications(uid, toCreate, notifications.data).catch(
      () => {
        // Allow a retry on the next data change if the write failed.
        toCreate.forEach((d) => attempted.current.delete(d.id));
      },
    );
  }, [
    reminders.uid,
    anyLoading,
    reminders.data,
    tasks.data,
    payments.data,
    documents.data,
    notifications.data,
  ]);

  return null;
}
