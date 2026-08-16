"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { useAuth } from "@/components/providers/AuthProvider";

export interface NotificationPrefs {
  reminders: boolean;
  tasks: boolean;
  payments: boolean;
  documents: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  reminders: true,
  tasks: true,
  payments: true,
  documents: true,
};

export interface ProfileDoc {
  displayName: string | null;
  timezone: string;
  focus: string[];
  onboarded: boolean;
  notificationPrefs?: NotificationPrefs;
  createdAt?: number;
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
