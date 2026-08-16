"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Phase = "idle" | "processing" | "success";

/**
 * A control that transforms through its own states: Mark paid → Processing →
 * Paid. The morph communicates the state change instead of an abrupt swap.
 */
export function PayButton({
  onPay,
  size = "md",
}: {
  onPay: () => Promise<void>;
  size?: "sm" | "md";
}) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("idle");

  async function handle() {
    if (phase !== "idle") return;
    setPhase("processing");
    try {
      await onPay();
      setPhase("success");
      // The row usually unmounts/moves after success; reset just in case.
      setTimeout(() => setPhase("idle"), 1200);
    } catch {
      setPhase("idle");
    }
  }

  return (
    <motion.button
      type="button"
      onClick={handle}
      disabled={phase !== "idle"}
      aria-label="Mark payment paid"
      layout
      className={cn(
        "relative inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-full font-medium text-[var(--text-onGold)]",
        "bg-gradient-to-b from-gold-200 to-gold-400 shadow-[0_4px_14px_rgba(160,120,50,0.28)]",
        size === "sm" ? "h-8 px-3 text-xs" : "h-9 px-4 text-sm",
        phase === "success" && "!from-emerald-300 !to-emerald-500 !text-emerald-950",
      )}
      whileTap={reduced || phase !== "idle" ? undefined : { scale: 0.96 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {phase === "idle" && (
          <motion.span
            key="idle"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
          >
            Mark paid
          </motion.span>
        )}
        {phase === "processing" && (
          <motion.span
            key="processing"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1.5"
          >
            <Loader2 className="size-4 animate-spin" />
            Paying
          </motion.span>
        )}
        {phase === "success" && (
          <motion.span
            key="success"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 24 }}
            className="flex items-center gap-1.5"
          >
            <Check className="size-4" strokeWidth={3} />
            Paid
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
