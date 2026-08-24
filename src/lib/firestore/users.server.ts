import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import type { SessionUser } from "@/lib/auth/session";

/**
 * Create the users/{uid} profile document if it doesn't exist yet. Idempotent —
 * safe to call on every session creation. New users start un-onboarded.
 */
export async function ensureUserDoc(user: SessionUser): Promise<void> {
  const ref = getAdminDb().collection("users").doc(user.uid);
  const snap = await ref.get();
  if (snap.exists) {
    // Keep identity fields fresh (e.g. Google display name / photo changes).
    await ref.set(
      {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return;
  }
  await ref.set({
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
    onboarded: false,
    timezone: "UTC",
    focus: [],
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/** Mark the user's email verified in both Auth and the profile doc. */
export async function markEmailVerified(uid: string): Promise<void> {
  const { getAdminAuth } = await import("@/lib/firebase/admin");
  await getAdminAuth().updateUser(uid, { emailVerified: true });
  await getAdminDb()
    .collection("users")
    .doc(uid)
    .set(
      { emailVerified: true, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
}

export interface OnboardingInput {
  displayName: string;
  timezone: string;
  focus: string[];
  /* Locale/region (optional; auto-detected on the client). */
  locale?: string;
  region?: string;
  currency?: string;
  weekStart?: 0 | 1;
  hour12?: boolean;
  accountType?: "personal" | "business";
  /** The person accepted the Privacy Policy + Terms during setup. */
  acceptedLegal?: boolean;
  /** Chosen preset avatar id (see lib/avatars). */
  avatar?: string;
}

/** Persist onboarding answers and flip the onboarded flag. */
export async function completeOnboarding(
  uid: string,
  input: OnboardingInput,
): Promise<void> {
  const doc: Record<string, unknown> = {
    displayName: input.displayName,
    timezone: input.timezone,
    focus: input.focus,
    onboarded: true,
    updatedAt: FieldValue.serverTimestamp(),
  };
  // Only persist locale fields that were provided.
  if (input.locale) doc.locale = input.locale;
  if (input.region) doc.region = input.region;
  if (input.currency) doc.currency = input.currency;
  if (input.weekStart !== undefined) doc.weekStart = input.weekStart;
  if (input.hour12 !== undefined) doc.hour12 = input.hour12;
  if (input.accountType) doc.accountType = input.accountType;
  if (input.acceptedLegal) doc.acceptedLegalAt = Date.now();
  if (input.avatar) doc.avatar = input.avatar;

  await getAdminDb().collection("users").doc(uid).set(doc, { merge: true });
}
