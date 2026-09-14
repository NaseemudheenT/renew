"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { AnimatedModal } from "@/components/motion";
import { TransactionForm } from "@/components/finance/TransactionForm";
import { createTransaction, type TransactionInput } from "@/lib/firestore/transactions";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useLocale } from "@/components/providers/LocaleProvider";
import { toast } from "@/components/ui/toast-store";
import { haptic, HAPTIC_SUCCESS } from "@/lib/haptics";

/**
 * Add money from anywhere — a phone-first floating button. Most people log an
 * expense on their phone the moment it happens, so this is always one thumb-tap
 * away (mobile only; desktop adds from each page). Opens the redesigned
 * amount-first form and saves straight to the current workspace.
 */
export function QuickAddFab() {
  const { uid } = useUserProfile();
  const { prefs } = useLocale();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function add(input: TransactionInput): Promise<boolean> {
    if (!uid) return false;
    setSubmitting(true);
    try {
      await createTransaction(uid, input);
      haptic(HAPTIC_SUCCESS);
      toast({ title: "Added", variant: "success" });
      return true;
    } catch {
      toast({ title: "Couldn't add that — please try again", variant: "error" });
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <motion.button
        type="button"
        onClick={() => { haptic(12); setOpen(true); }}
        aria-label="Add expense or income"
        className="fixed end-4 bottom-5 z-40 grid size-14 place-items-center rounded-full bg-gradient-to-br from-[var(--color-gold-300)] to-[var(--color-gold-500)] text-[var(--text-onGold)] lg:hidden"
        style={{ boxShadow: "0 12px 30px -8px var(--color-gold-500)" }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 24, delay: 0.15 }}
        whileTap={{ scale: 0.92 }}
      >
        <Plus className="size-6" strokeWidth={2.5} />
      </motion.button>

      <AnimatedModal open={open} onClose={() => setOpen(false)} title="Add money">
        <TransactionForm defaultCurrency={prefs.currency} submitting={submitting}
          onSubmit={async (i) => { if (await add(i)) setOpen(false); }} onCancel={() => setOpen(false)} />
      </AnimatedModal>
    </>
  );
}
