"use client";

import { updateDoc, serverTimestamp, arrayUnion } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { doc } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { deleteField } from "firebase/firestore";
import type { NotificationPrefs, AccountType } from "@/hooks/useUserProfile";
import type { CustomCategory } from "@/lib/types";
import type { PasscodeRecord } from "@/lib/security/passcode";

function profileRef(uid: string) {
  return doc(getDb(), "users", uid);
}

/** Update the user's display name (Firebase Auth + profile doc). */
export async function updateDisplayName(uid: string, name: string): Promise<void> {
  const trimmed = name.trim();
  const current = getFirebaseAuth().currentUser;
  if (current) await updateProfile(current, { displayName: trimmed });
  await updateDoc(profileRef(uid), {
    displayName: trimmed,
    updatedAt: serverTimestamp(),
  });
}

export async function updateTimezone(uid: string, timezone: string): Promise<void> {
  await updateDoc(profileRef(uid), { timezone, updatedAt: serverTimestamp() });
}

/** Change the preset avatar (see lib/avatars). */
export async function updateAvatar(uid: string, avatar: string): Promise<void> {
  await updateDoc(profileRef(uid), { avatar, updatedAt: serverTimestamp() });
}

/** Set the subscription plan. Premium is additive; downgrading never deletes
 *  data. Real billing is enforced server-side once a provider is connected —
 *  this write alone must never be treated as proof of payment. */
export async function setPlan(uid: string, plan: "free" | "premium"): Promise<void> {
  await updateDoc(profileRef(uid), {
    plan,
    ...(plan === "premium" ? { planSince: Date.now() } : {}),
    updatedAt: serverTimestamp(),
  });
}

/** Record that the person wants to be notified when Premium checkout launches,
 *  optionally with the billing period they were looking at. */
export async function setPremiumInterest(
  uid: string,
  interested: boolean,
  period?: "monthly" | "yearly",
): Promise<void> {
  await updateDoc(profileRef(uid), {
    premiumInterest: interested,
    ...(period ? { premiumPeriodInterest: period } : {}),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Teach Renew that a description maps to a category (see lib/categorize). Merges
 * one entry into the user's learned table, capped so it can't grow unbounded —
 * when full, the oldest-inserted keys are dropped (insertion order preserved by
 * object key order). No AI, no cost; this is what makes categories self-improve.
 */
const LEARNED_CAP = 500;
export async function learnCategory(
  uid: string,
  current: Record<string, string> | undefined,
  key: string,
  category: string,
): Promise<void> {
  if (!key || !category) return;
  const base = current ?? {};
  // No-op if already the same mapping (avoid a pointless write on every save).
  if (base[key] === category) return;
  const next: Record<string, string> = { ...base, [key]: category };
  const keys = Object.keys(next);
  const trimmed = keys.length > LEARNED_CAP
    ? Object.fromEntries(keys.slice(keys.length - LEARNED_CAP).map((k) => [k, next[k]!]))
    : next;
  await updateDoc(profileRef(uid), { learnedCategories: trimmed, updatedAt: serverTimestamp() });
}

/** Persist one more receipt scan against the free-tier monthly allowance.
 *  `next` is computed with lib/plan's nextScanUsage so month rollover is
 *  handled in one place. Premium users are unlimited and never call this. */
export async function recordScanUsage(
  uid: string,
  next: { month: string; count: number },
): Promise<void> {
  await updateDoc(profileRef(uid), { scanUsage: next, updatedAt: serverTimestamp() });
}

/** Set (or update) the app-lock passcode + biometric record. */
export async function setSecurity(uid: string, security: PasscodeRecord): Promise<void> {
  await updateDoc(profileRef(uid), { security, updatedAt: serverTimestamp() });
}

/** Turn the app lock off entirely. */
export async function clearSecurity(uid: string): Promise<void> {
  await updateDoc(profileRef(uid), { security: deleteField(), updatedAt: serverTimestamp() });
}

/** Toggle just the biometric preference without touching the passcode. */
export async function setBiometricEnabled(uid: string, current: PasscodeRecord, enabled: boolean): Promise<void> {
  await updateDoc(profileRef(uid), { security: { ...current, biometricEnabled: enabled, updatedAt: Date.now() }, updatedAt: serverTimestamp() });
}

/** Personal / business — how the person uses Renew. */
export async function updateAccountType(
  uid: string,
  accountType: AccountType,
): Promise<void> {
  await updateDoc(profileRef(uid), { accountType, updatedAt: serverTimestamp() });
}

/** Locale/region override the user can set in Settings → Region & Language. */
export interface LocalePrefsPatch {
  locale?: string;
  region?: string;
  currency?: string;
  timezone?: string;
  weekStart?: 0 | 1;
  hour12?: boolean;
}

export async function updateLocalePrefs(
  uid: string,
  patch: LocalePrefsPatch,
): Promise<void> {
  await updateDoc(profileRef(uid), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

/** Add a user-defined category to the profile. */
export async function addCustomCategory(
  uid: string,
  cat: CustomCategory,
): Promise<void> {
  await updateDoc(profileRef(uid), {
    customCategories: arrayUnion(cat),
    updatedAt: serverTimestamp(),
  });
}

/** Add a user-defined subcategory under a category (built-in id or custom id).
 *  Stored as a per-category list so people can grow their own taxonomy. */
export async function addCustomSubcategory(
  uid: string,
  categoryId: string,
  label: string,
): Promise<void> {
  const clean = label.trim();
  if (!clean) return;
  await updateDoc(profileRef(uid), {
    [`customSubcategories.${categoryId}`]: arrayUnion(clean),
    updatedAt: serverTimestamp(),
  });
}

/** Dismiss a detected recurring-payment suggestion so it stops being offered. */
export async function ignoreRecurring(uid: string, key: string): Promise<void> {
  await updateDoc(profileRef(uid), {
    ignoredRecurring: arrayUnion(key),
    updatedAt: serverTimestamp(),
  });
}

/** Set the auto-clean retention window (days; 0 = keep everything). */
export async function updateDataRetention(uid: string, days: number): Promise<void> {
  await updateDoc(profileRef(uid), { dataRetentionDays: days, updatedAt: serverTimestamp() });
}

/** Ren voice & style preferences (partial merge). */
export async function updateRenPrefs(
  uid: string,
  patch: { renAutoSpeak?: boolean; renVoiceURI?: string; renVoiceRate?: number; renStyle?: "concise" | "balanced" | "detailed"; renPersonality?: "warm" | "neutral" | "precise" },
): Promise<void> {
  await updateDoc(profileRef(uid), { ...patch, updatedAt: serverTimestamp() });
}

export async function updateNotificationPrefs(
  uid: string,
  prefs: NotificationPrefs,
): Promise<void> {
  await updateDoc(profileRef(uid), {
    notificationPrefs: prefs,
    updatedAt: serverTimestamp(),
  });
}
