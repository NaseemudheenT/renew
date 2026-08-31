"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import type { CustomCategory } from "@/lib/types";
import type { PasscodeRecord } from "@/lib/security/passcode";

export interface NotificationPrefs {
  reminders: boolean;
  tasks: boolean;
  payments: boolean;
  documents: boolean;
  budgets: boolean;
  savings: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  reminders: true,
  tasks: true,
  payments: true,
  documents: true,
  budgets: true,
  savings: true,
};

/** How a person uses Renew — Personal or Business. */
export type AccountType = "personal" | "business";

export interface ProfileDoc {
  displayName: string | null;
  timezone: string;
  focus: string[];
  onboarded: boolean;
  /** Personal (default) or business. Seeds the workspace; never hides money. */
  accountType?: AccountType;
  notificationPrefs?: NotificationPrefs;
  createdAt?: number;
  /* ---- Locale & region (all optional; auto-detected until overridden) ---- */
  /** BCP-47 language subtag, e.g. "en", "es". */
  locale?: string;
  /** ISO-3166 region, e.g. "US", "IN". */
  region?: string;
  /** ISO-4217 display currency, e.g. "USD". */
  currency?: string;
  /** 0 = Sunday, 1 = Monday. */
  weekStart?: 0 | 1;
  /** 12-hour clock preference. */
  hour12?: boolean;
  /** User-defined income/expense categories. */
  customCategories?: CustomCategory[];
  /** User-defined subcategories, keyed by category id (built-in or custom).
   *  Lets a person build their own taxonomy under any category. */
  customSubcategories?: Record<string, string[]>;
  /** Recurring-payment suggestions the person dismissed (by pattern key). */
  ignoredRecurring?: string[];
  /** App-lock passcode + biometric settings (see lib/security/passcode). */
  security?: PasscodeRecord;
  /** Chosen preset avatar id (see lib/avatars). */
  avatar?: string;
  /** When the person accepted the Privacy Policy + Terms. */
  acceptedLegalAt?: number;
  /** Auto-clean window in days (0/undefined = keep everything). Transactions
   *  older than this are removed on app open. See lib/retention. */
  dataRetentionDays?: number;
}

/** Realtime subscription to the signed-in user's profile document. */
export function useUserProfile(): {
  profile: ProfileDoc | null;
  loading: boolean;
  uid: string | null;
} {
  const { user, loading: authLoading } = useAuth();
  const uid = user?.uid ?? null;
  const [profile, setProfile] = useState<ProfileDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !uid) return;
    const unsub = onSnapshot(
      doc(getDb(), "users", uid),
      (snap) => {
        setProfile((snap.data() as ProfileDoc) ?? null);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [uid, authLoading]);

  if (!uid) return { profile: null, loading: authLoading, uid: null };
  return { profile, loading, uid };
}
