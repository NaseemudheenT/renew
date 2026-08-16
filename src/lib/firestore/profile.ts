"use client";

import { updateDoc, serverTimestamp } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { doc } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { getFirebaseAuth } from "@/lib/firebase/client";
import type { NotificationPrefs } from "@/hooks/useUserProfile";

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

export async function updateNotificationPrefs(
  uid: string,
  prefs: NotificationPrefs,
): Promise<void> {
  await updateDoc(profileRef(uid), {
    notificationPrefs: prefs,
    updatedAt: serverTimestamp(),
  });
}
