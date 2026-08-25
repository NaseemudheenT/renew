import type { Transition, Variants } from "framer-motion";

/**
 * RENEW — Motion language.
 *
 * One source of truth for every animation in the product so motion feels like
 * a single, intentional system: calm, physical, cinematic. Micro-interactions
 * are quick; major state changes breathe. Everything respects reduced motion
 * via Framer Motion's `useReducedMotion` (see `useMotion` below).
 */

/* ---- Easings ------------------------------------------------------------- */
/** The calm signature ease — matches --ease-calm in globals.css. */
export const easeCalm = [0.22, 1, 0.36, 1] as const;
/** Gentle ease for exits / fades. */
export const easeSoft = [0.4, 0, 0.2, 1] as const;

/* ---- Springs ------------------------------------------------------------- */
export const spring = {
  /** Snappy micro-interactions (buttons, toggles, hovers). */
  snappy: { type: "spring", stiffness: 520, damping: 32, mass: 0.7 },
  /** Natural default for layout & shared-element moves. */
  natural: { type: "spring", stiffness: 320, damping: 34, mass: 0.9 },
  /** Slow, weighty entrances for major surfaces. */
  gentle: { type: "spring", stiffness: 180, damping: 30, mass: 1 },
} satisfies Record<string, Transition>;

/* ---- Durations (for tween-based transitions) ----------------------------- */
export const duration = {
  fast: 0.18,
  base: 0.32,
  slow: 0.6,
  cinematic: 0.9,
} as const;

export const tween = {
  fast: { duration: duration.fast, ease: easeCalm },
  base: { duration: duration.base, ease: easeCalm },
  slow: { duration: duration.slow, ease: easeCalm },
} satisfies Record<string, Transition>;

/* ---- Reusable variants --------------------------------------------------- */

/** Fade + subtle scale — the default "appear". */
export const fadeScale: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  show: { opacity: 1, scale: 1, transition: { ...tween.base } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: duration.fast, ease: easeSoft } },
};

/** Rise up into place — cards, list items, sections. */
export const rise: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: spring.natural },
  exit: { opacity: 0, y: 8, transition: { duration: duration.fast, ease: easeSoft } },
};

/** Slide reveal from a direction (used by SlideReveal). */
export function slideVariants(
  direction: "up" | "down" | "left" | "right" = "up",
  distance = 24,
): Variants {
  const horizontal = direction === "left" || direction === "right";
  const sign = direction === "up" || direction === "left" ? 1 : -1;
  const offset = sign * distance;
  // Concrete axis objects avoid a computed-key index signature (Framer types).
  const from = horizontal ? { x: offset } : { y: offset };
  const to = horizontal ? { x: 0 } : { y: 0 };
  const half = horizontal ? { x: offset / 2 } : { y: offset / 2 };
  return {
    hidden: { opacity: 0, ...from },
    show: { opacity: 1, ...to, transition: spring.natural },
    exit: {
      opacity: 0,
      ...half,
      transition: { duration: duration.fast, ease: easeSoft },
    },
  };
}

/** Stagger container — children animate in sequence. */
export function staggerContainer(stagger = 0.06, delayChildren = 0): Variants {
  return {
    hidden: {},
    show: {
      transition: { staggerChildren: stagger, delayChildren },
    },
    exit: {
      transition: { staggerChildren: stagger / 2, staggerDirection: -1 },
    },
  };
}

/** Page transition — a cinematic focus-in: the new page lifts and settles as a
 *  faint blur snaps to sharp, giving a modern depth-of-field feel. */
export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.992, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { duration: duration.slow, ease: easeCalm } },
  exit: { opacity: 0, y: -8, filter: "blur(4px)", transition: { duration: duration.base, ease: easeSoft } },
};

/** Modal / dialog surface (desktop-centred dialog). */
export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  show: { opacity: 1, scale: 1, y: 0, transition: spring.natural },
  exit: { opacity: 0, scale: 0.97, y: 8, transition: { duration: duration.fast, ease: easeSoft } },
};

/** Mobile sheet — slides up from the bottom like a native iOS sheet. */
export const sheetVariants: Variants = {
  hidden: { y: "100%" },
  show: { y: 0, transition: { type: "spring", stiffness: 360, damping: 36, mass: 0.9 } },
  exit: { y: "100%", transition: { duration: duration.base, ease: easeSoft } },
};

export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: duration.base, ease: easeCalm } },
  exit: { opacity: 0, transition: { duration: duration.fast, ease: easeSoft } },
};

/** Interaction feedback for tappable surfaces. */
export const tap = { scale: 0.97 } as const;
export const hoverLift = { y: -2 } as const;
