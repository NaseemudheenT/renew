"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The title block every screen opens with. It rises in softly and a short
 * champagne accent draws itself under the title — one calm, premium entrance
 * shared across the whole app (reduced-motion safe via the global MotionConfig).
 */
export function PageHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className={cn("mb-6 flex flex-wrap items-end justify-between gap-3", className)}
    >
      <div>
        <h1 className="text-strong text-2xl font-light tracking-tight">{title}</h1>
        <motion.span
          aria-hidden="true"
          className="mt-2 block h-[3px] w-9 origin-left rounded-full bg-gradient-to-r from-[var(--color-gold-400)] via-[var(--color-gold-500)] to-transparent"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 0.14, duration: 0.55, ease: EASE }}
        />
        {subtitle && <p className="text-muted mt-2 text-sm">{subtitle}</p>}
      </div>
      {action}
    </motion.div>
  );
}
