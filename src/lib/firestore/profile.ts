"use client";

import { updateDoc, serverTimestamp, arrayUnion, arrayRemove } from "firebase/firestore";
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

/** Remove a user-defined category (existing transactions keep their id). */
export async function removeCustomCategory(
  uid: string,
  cat: CustomCategory,
): Promise<void> {
  await updateDoc(profileRef(uid), {
    customCategories: arrayRemove(cat),
    updatedAt: serverTimestamp(),
  });
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
