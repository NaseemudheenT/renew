"use client";

import { useEffect, useMemo, useRef } from "react";
import { orderBy, limit } from "firebase/firestore";
import { useUserCollection } from "@/hooks/useUserCollection";
import { useUserProfile, DEFAULT_NOTIFICATION_PREFS } from "@/hooks/useUserProfile";
import {
  computeDesired,
  createMissingNotifications,
} from "@/lib/firestore/notifications-generate";
import { browserNotifyStatus, showBrowserNotification } from "@/lib/notify";
import type {
  Payment,
  Budget,
  SavingsGoal,
  Transaction,
  Subscription,
  AppNotification,
} from "@/lib/types";

/**
 * Invisible worker mounted in the shell. It derives the notifications that
 * should exist from the user's real data (due/overdue/expiring items) and
 * creates any that are missing. Deterministic ids keep it idempotent, so it
 * never duplicates or resets read state. Runs whenever the source data changes.
 */
export function NotificationSync() {
  const payments = useUserCollection<Payment>("payments");
  const budgets = useUserCollection<Budget>("budgets");
  const savings = useUserCollection<SavingsGoal>("savings");
  const transactions = useUserCollection<Transaction>("transactions");
  const subscriptions = useUserCollection<Subscription>("subscriptions");
  const notifConstraints = useMemo(
    () => [orderBy("createdAt", "desc"), limit(100)],
    [],
  );
  const notifications = useUserCollection<AppNotification>(
    "notifications",
    notifConstraints,
  );

  const { profile } = useUserProfile();
  const prefs = useMemo(
    () => ({ ...DEFAULT_NOTIFICATION_PREFS, ...profile?.notificationPrefs }),
    [profile?.notificationPrefs],
  );

  const attempted = useRef<Set<string>>(new Set());

  const anyLoading =
    payments.loading ||
    budgets.loading ||
    savings.loading ||
    transactions.loading ||
    subscriptions.loading ||
    notifications.loading;

  useEffect(() => {
    const uid = payments.uid;
    if (!uid || anyLoading) return;

    const desired = computeDesired(
      {
        reminders: [],
        tasks: [],
        payments: payments.data,
        documents: [],
        budgets: budgets.data,
        savings: savings.data,
        transactions: transactions.data,
        subscriptions: subscriptions.data,
        customCategories: profile?.customCategories ?? [],
      },
      prefs,
      profile?.locale ?? "en",
    );

    // Skip ids already present or already attempted this session.
    const existingIds = new Set(notifications.data.map((n) => n.id));
    const toCreate = desired.filter(
      (d) => !existingIds.has(d.id) && !attempted.current.has(d.id),
    );
    if (toCreate.length === 0) return;
    toCreate.forEach((d) => attempted.current.add(d.id));

    void createMissingNotifications(uid, toCreate, notifications.data)
      .then(() => {
        // Surface newly-created items as OS notifications when permitted and the
        // tab is backgrounded (avoids duplicating what's already on screen).
        if (browserNotifyStatus() !== "granted" || document.visibilityState !== "hidden") return;
        toCreate.slice(0, 3).forEach((d) => {
          void showBrowserNotification({ id: d.id, title: d.title, body: d.body, href: d.href });
        });
      })
      .catch(() => {
        // Allow a retry on the next data change if the write failed.
        toCreate.forEach((d) => attempted.current.delete(d.id));
      });
  }, [
    payments.uid,
    anyLoading,
    payments.data,
    budgets.data,
    savings.data,
    transactions.data,
    subscriptions.data,
    notifications.data,
    prefs,
    profile?.locale,
    profile?.customCategories,
  ]);

  return null;
}
