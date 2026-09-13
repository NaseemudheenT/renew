"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RenLogo } from "@/components/brand/RenLogo";
import { RenVoice } from "@/components/finance/RenVoice";
import { useRenContext } from "@/hooks/useRenContext";

/**
 * Ren, everywhere. A floating champagne orb present on every signed-in screen —
 * tap it and Ren opens the Siri-style voice moment (RenVoice), already knowing
 * your money. The full text conversation lives in Settings › Ren.
 */
export function RenLauncher() {
  const [open, setOpen] = useState(false);
  const { ctx, uid } = useRenContext();

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Ren, your finance assistant"
        className="fixed end-4 bottom-24 z-40 grid size-14 place-items-center rounded-full lg:bottom-6 lg:end-6"
        style={{ boxShadow: "0 10px 30px -6px var(--color-gold-500)" }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 24, delay: 0.2 }}
        whileHover={{ scale: 1.06, y: -2 }}
        whileTap={{ scale: 0.94 }}
      >
        <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-[var(--color-gold-400)]/30" style={{ animationDuration: "3s" }} />
        <RenLogo size={56} idSuffix="fab" className="relative" />
      </motion.button>

      <RenVoice open={open} onClose={() => setOpen(false)} uid={uid} ctx={ctx} />
    </>
  );
}
