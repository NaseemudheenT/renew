"use client";

import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

interface RenewMarkProps {
  size?: number;
  /** Play the cinematic draw-on reveal when it mounts. */
  animated?: boolean;
  /** Soft gold glow behind the mark. */
  glow?: boolean;
  className?: string;
  title?: string;
}

const draw: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (i: number) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { delay: i * 0.35, duration: 1.6, ease: [0.22, 1, 0.36, 1] },
      opacity: { delay: i * 0.35, duration: 0.4 },
    },
  }),
};

/**
 * The Renew brand mark: a broken golden ring (the renewal cycle) cradling a
 * checkmark (done / trust). Drawn on a 120×120 grid. Colors come from the CSS
 * gold tokens, so it adapts to light/dark automatically.
 */
export function RenewMark({
  size = 120,
  animated = false,
  glow = true,
  className,
  title = "Renew",
}: RenewMarkProps) {
  const MotionPath = motion.path;
  const common = {
    fill: "none",
    stroke: "url(#renew-gold)",
    strokeWidth: 9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={title}
      className={cn("select-none", className)}
    >
      <defs>
        <linearGradient id="renew-gold" x1="20%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="var(--gold-bright)" />
          <stop offset="55%" stopColor="var(--gold)" />
          <stop offset="100%" stopColor="var(--gold-deep)" />
        </linearGradient>
        {glow && (
          <filter id="renew-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      <g filter={glow ? "url(#renew-glow)" : undefined}>
        {/* Upper ring arc — a broad sweep open on the right */}
        <MotionPath
          d="M 60 18 A 42 42 0 1 0 96 78"
          {...common}
          variants={animated ? draw : undefined}
          initial={animated ? "hidden" : undefined}
          animate={animated ? "visible" : undefined}
          custom={0}
        />
        {/* Lower-right ring segment — the second, shorter arc of the broken ring */}
        <MotionPath
          d="M 84 92 A 42 42 0 0 0 92 66"
          {...common}
          variants={animated ? draw : undefined}
          initial={animated ? "hidden" : undefined}
          animate={animated ? "visible" : undefined}
          custom={1}
        />
        {/* Checkmark — short arm into the long rising tail */}
        <MotionPath
          d="M 42 60 L 56 76 L 90 34"
          {...common}
          strokeWidth={10}
          variants={animated ? draw : undefined}
          initial={animated ? "hidden" : undefined}
          animate={animated ? "visible" : undefined}
          custom={1.4}
        />
      </g>
    </svg>
  );
}
