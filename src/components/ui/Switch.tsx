"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-all duration-300 disabled:opacity-50",
        checked
          ? "bg-gradient-to-r from-gold-300 to-gold-500 shadow-[0_2px_14px_-3px_var(--color-gold-500)]"
          : "bg-[var(--glass-bg-soft)] border border-[var(--field-border)]",
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 34 }}
        className={cn("absolute size-4.5 rounded-full bg-white shadow-sm", checked ? "right-1" : "left-1")}
      />
    </button>
  );
}
