"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ---- SuccessTransition --------------------------------------------------- */
/**
 * A champagne ring that draws itself and pops a checkmark — used after a
 * meaningful action completes (verification, save, payment).
 */
export function SuccessTransition({
  size = 72,
  className,
  label = "Done",
}: {
  size?: number;
  className?: string;
  label?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <div
      className={cn("grid place-items-center", className)}
      role="status"
      aria-label={label}
    >
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        initial={reduced ? { opacity: 0 } : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={spring.natural}
      >
        <defs>
          <linearGradient id="success-gold" x1="20" y1="14" x2="80" y2="88">
            <stop offset="0" stopColor="#F3DCA4" />
            <stop offset="0.6" stopColor="#C6A15B" />
            <stop offset="1" stopColor="#A5824A" />
          </linearGradient>
        </defs>
        <motion.circle
          cx="50"
          cy="50"
          r="42"
          stroke="url(#success-gold)"
          strokeWidth="6"
          strokeLinecap="round"
          initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: reduced ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
          transform="rotate(-90 50 50)"
        />
        <motion.path
          d="M32 51 L45 64 L70 36"
          stroke="url(#success-gold)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: reduced ? 0 : 0.35,
            delay: reduced ? 0 : 0.45,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      </motion.svg>
    </div>
  );
}

/* ---- LoadingTransition --------------------------------------------------- */
/** Three champagne dots breathing — calm, non-blocking loading feedback. */
export function LoadingTransition({
  className,
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <div
      className={cn("flex items-center gap-2", className)}
      role="status"
      aria-label={label}
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-2 rounded-full bg-[var(--color-gold-400)]"
          animate={reduced ? undefined : { opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

/* ---- CheckPop ------------------------------------------------------------ */
/** Small inline success checkmark for list items / toggles. */
export function CheckPop({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.span
      className={cn(
        "grid size-6 place-items-center rounded-full bg-gradient-to-b from-gold-200 to-gold-400 text-[var(--text-onGold)]",
        className,
      )}
      initial={reduced ? { opacity: 0 } : { scale: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={spring.snappy}
    >
      <Check className="size-3.5" strokeWidth={3} />
    </motion.span>
  );
}
