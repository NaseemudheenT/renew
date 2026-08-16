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
}

/** Persist onboarding answers and flip the onboarded flag. */
export async function completeOnboarding(
  uid: string,
  input: OnboardingInput,
): Promise<void> {
  await getAdminDb()
    .collection("users")
    .doc(uid)
    .set(
      {
        displayName: input.displayName,
        timezone: input.timezone,
        focus: input.focus,
        onboarded: true,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
}
