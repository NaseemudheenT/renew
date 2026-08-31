"use client";

import { useEffect, useRef } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useUserCollection } from "@/hooks/useUserCollection";
import { deleteManyTransactions } from "@/lib/firestore/transactions";
import { expiredIds } from "@/lib/retention";
import { toast } from "@/components/ui/toast-store";
import type { Transaction } from "@/lib/types";

/**
 * Applies the user's data-retention choice: when they've opted into an auto-clean
 * window, transactions older than it are removed once per app open. Off by
 * default (keep everything) — nothing runs unless the person chose a window in
 * Settings › Data. The "which to delete" decision lives in lib/retention and is
 * unit-tested; this just runs it safely once.
 */
export function RetentionCleanup() {
  const { profile, uid } = useUserProfile();
  const days = profile?.dataRetentionDays ?? 0;
  const { data, loading } = useUserCollection<Transaction>("transactions");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current || !uid || loading || days <= 0) return;
    const ids = expiredIds(data, days);
    ran.current = true; // one attempt per app open
    if (ids.length === 0) return;
    deleteManyTransactions(uid, ids)
      .then(() => toast({
        title: `Cleaned up ${ids.length} old ${ids.length === 1 ? "entry" : "entries"}`,
        variant: "success",
      }))
      .catch(() => { ran.current = false; }); // let it retry next open
  }, [uid, loading, days, data]);

  return null;
}
