"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { subscribeProfile } from "@/lib/firestore/profile";
import type { UserProfile } from "@/lib/firestore/types";

/** Live user profile. `undefined` while loading, `null` if none yet. */
export function useProfile(): UserProfile | null | undefined {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeProfile(user.uid, setProfile);
    return () => unsub();
  }, [user]);

  return profile;
}
