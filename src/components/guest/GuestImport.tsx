"use client";

import { useEffect, useRef } from "react";
import { getGuestTxns, deleteGuestTxn } from "@/lib/guest";
import { createTransaction } from "@/lib/firestore/transactions";
import { toast } from "@/components/ui/toast-store";

/**
 * Once the person signs in, any expenses they logged as a guest (before signing
 * in) are moved into their real account — oldest first so dates read naturally.
 * Each entry is removed from the guest store only after it's safely saved, so a
 * transient failure just leaves it for the next load. Renders nothing.
 */
export function GuestImport({ uid }: { uid: string }) {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current || !uid) return;
    ran.current = true;

    const pending = getGuestTxns();
    if (pending.length === 0) return;

    (async () => {
      let saved = 0;
      for (const g of [...pending].reverse()) {
        try {
          await createTransaction(uid, {
            type: g.type,
            amount: g.amount,
            currency: g.currency,
            category: g.category,
            note: g.note,
            date: g.date,
          });
          deleteGuestTxn(g.id);
          saved++;
        } catch {
          /* leave it in the guest store to retry on the next load */
        }
      }
      if (saved > 0) {
        toast({
          title: saved === 1 ? "Your first entry was saved to your account" : `${saved} entries saved to your account`,
          variant: "success",
        });
      }
    })();
  }, [uid]);

  return null;
}
