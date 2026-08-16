"use client";

import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants,
} from "framer-motion";
import {
  forwardRef,
  type ElementType,
  type ReactNode,
} from "react";
import {
  fadeScale,
  rise,
  slideVariants,
  staggerContainer,
  pageVariants,
} from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * When the user prefers reduced motion we collapse every variant to a plain
 * opacity fade with no transform — content still appears, nothing moves.
 */
const reduced_: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.001 } },
  exit: { opacity: 0, transition: { duration: 0.001 } },
};
function reduce(_variants: Variants): Variants {
  return reduced_;
}

/* ---- PageTransition ------------------------------------------------------ */
export function PageTransition({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={cn(className)}
      variants={reduced ? reduce(pageVariants) : pageVariants}
      initial="hidden"
      animate="show"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}

/* ---- FadeScale ----------------------------------------------------------- */
export interface MotionBoxProps extends HTMLMotionProps<"div"> {
  as?: ElementType;
  delay?: number;
}

export const FadeScale = forwardRef<HTMLDivElement, MotionBoxProps>(
  function FadeScale({ children, className, delay = 0, ...props }, ref) {
    const reduced = useReducedMotion();
    return (
      <motion.div
        ref={ref}
        className={className}
        variants={reduced ? reduce(fadeScale) : fadeScale}
        initial="hidden"
        animate="show"
        exit="exit"
        transition={{ delay }}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);

/* ---- Rise (fade + lift) -------------------------------------------------- */
export const Rise = forwardRef<HTMLDivElement, MotionBoxProps>(function Rise(
  { children, className, delay = 0, ...props },
  ref,
) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      ref={ref}
      className={className}
      variants={reduced ? reduce(rise) : rise}
      initial="hidden"
      animate="show"
      exit="exit"
      transition={{ delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
});

/* ---- SlideReveal --------------------------------------------------------- */
export function SlideReveal({
  children,
  className,
  direction = "up",
  distance = 24,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
  distance?: number;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const v = slideVariants(direction, distance);
  return (
    <motion.div
      className={className}
      variants={reduced ? reduce(v) : v}
      initial="hidden"
      animate="show"
      exit="exit"
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

/* ---- StaggerContainer + StaggerItem -------------------------------------- */
export function StaggerContainer({
  children,
  className,
  stagger = 0.06,
  delayChildren = 0,
  as: _as,
  ...props
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delayChildren?: number;
  as?: ElementType;
} & HTMLMotionProps<"div">) {
  return (
    <motion.div
      className={className}
      variants={staggerContainer(stagger, delayChildren)}
      initial="hidden"
      animate="show"
      exit="exit"
      {...props}
    >
      {children}
    </motion.div>
  );
}

export const StaggerItem = forwardRef<HTMLDivElement, MotionBoxProps>(
  function StaggerItem({ children, className, ...props }, ref) {
    const reduced = useReducedMotion();
    return (
      <motion.div
        ref={ref}
        className={className}
        variants={reduced ? reduce(rise) : rise}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);

/* ---- AnimatedList -------------------------------------------------------- */
/**
 * A list where items enter, exit, and re-order with physical layout motion.
 * Wrap items in <AnimatePresence> and give each a stable `key`.
 */
export function AnimatedList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div layout className={cn(className)}>
      <AnimatePresence initial={false} mode="popLayout">
        {children}
      </AnimatePresence>
    </motion.div>
  );
}

export const AnimatedListItem = forwardRef<HTMLDivElement, MotionBoxProps>(
  function AnimatedListItem({ children, className, ...props }, ref) {
    const reduced = useReducedMotion();
    return (
      <motion.div
        ref={ref}
        layout={reduced ? false : "position"}
        className={className}
        variants={reduced ? reduce(rise) : rise}
        initial="hidden"
        animate="show"
        exit="exit"
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);
