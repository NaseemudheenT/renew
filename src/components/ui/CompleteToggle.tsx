"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Animated circular completion control. Champagne fill + check pop when done. */
export function CompleteToggle({
  completed,
  onToggle,
  label,
  className,
}: {
  completed: boolean;
  onToggle: () => void;
  label: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <button
      type="button"
      onClick={onToggle}
      role="checkbox"
      aria-checked={completed}
      aria-label={label}
      className={cn(
        "grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors",
        completed
          ? "border-transparent bg-gradient-to-b from-gold-300 to-gold-500 text-[var(--text-onGold)]"
          : "border-[var(--field-border)] text-transparent hover:border-[var(--focus-ring)]",
        className,
      )}
    >
      <motion.span
        initial={false}
        animate={
          reduced
            ? { opacity: completed ? 1 : 0 }
            : { scale: completed ? 1 : 0, opacity: completed ? 1 : 0 }
        }
        transition={{ type: "spring", stiffness: 500, damping: 28 }}
      >
        <Check className="size-3.5" strokeWidth={3} />
      </motion.span>
    </button>
  );
}
