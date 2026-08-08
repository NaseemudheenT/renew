"use client";

import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

interface RenewMarkProps {
  size?: number;
  /** Play the cinematic draw-on reveal + light sweep when it mounts. */
  animated?: boolean;
  /** Soft gold glow behind the mark. */
  glow?: boolean;
  className?: string;
  title?: string;
}

// Shared geometry (120×120 grid): broken ring + checkmark.
const RING_UPPER = "M 60 18 A 42 42 0 1 0 96 78";
const RING_LOWER = "M 84 92 A 42 42 0 0 0 92 66";
const CHECK = "M 42 60 L 56 76 L 90 34";

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
 * checkmark (done / trust). Colors come from the CSS gold tokens, so it adapts
 * to light/dark automatically. When `animated`, the strokes draw on and a light
 * sweep travels across the gold once the ring completes, then occasionally.
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
  const maskStroke = {
    fill: "none",
    stroke: "#fff",
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
        <linearGradient id="renew-sheen-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="50%" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
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
        {animated && (
          <mask id="renew-mark-mask">
            <path d={RING_UPPER} {...maskStroke} strokeWidth={9} />
            <path d={RING_LOWER} {...maskStroke} strokeWidth={9} />
            <path d={CHECK} {...maskStroke} strokeWidth={10} />
          </mask>
        )}
      </defs>

      <g filter={glow ? "url(#renew-glow)" : undefined}>
        <MotionPath
          d={RING_UPPER}
          {...common}
          variants={animated ? draw : undefined}
          initial={animated ? "hidden" : undefined}
          animate={animated ? "visible" : undefined}
          custom={0}
        />
        <MotionPath
          d={RING_LOWER}
          {...common}
          variants={animated ? draw : undefined}
          initial={animated ? "hidden" : undefined}
          animate={animated ? "visible" : undefined}
          custom={1}
        />
        <MotionPath
          d={CHECK}
          {...common}
          strokeWidth={10}
          variants={animated ? draw : undefined}
          initial={animated ? "hidden" : undefined}
          animate={animated ? "visible" : undefined}
          custom={1.4}
        />
      </g>

      {/* Light sweep — masked to the mark, plays after the ring completes. */}
      {animated && (
        <g mask="url(#renew-mark-mask)">
          <motion.rect
            x={-45}
            y={0}
            width={42}
            height={120}
            fill="url(#renew-sheen-grad)"
            initial={{ x: -45, opacity: 0 }}
            animate={{ x: [-45, 130], opacity: [0, 1, 1, 0] }}
            transition={{
              delay: 2.3,
              duration: 1.1,
              ease: [0.22, 1, 0.36, 1],
              repeat: Infinity,
              repeatDelay: 6,
              times: [0, 0.1, 0.9, 1],
            }}
          />
        </g>
      )}
    </svg>
  );
}
