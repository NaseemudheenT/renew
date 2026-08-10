"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { subscribeReminders } from "@/lib/firestore/reminders";
import type { Reminder } from "@/lib/firestore/types";

/**
 * Live reminders for the current user. `null` while loading; `[]` when empty.
 * State is only set from the Firestore snapshot callback (never synchronously
 * in the effect body).
 */
export function useReminders(): Reminder[] | null {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[] | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeReminders(user.uid, setReminders);
    return () => unsub();
  }, [user]);

  return reminders;
}
