"use client";

import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants,
} from "framer-motion";
import { forwardRef, type ElementType, type ReactNode } from "react";
import {
  fadeScale,
  rise,
  slideVariants,
  staggerContainer,
  pageVariants,
} from "@/lib/motion";
import { cn } from "@/lib/utils";

const REDUCED: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.001 } },
  exit: { opacity: 0, transition: { duration: 0.001 } },
};
const pick = (v: Variants, reduced: boolean | null) => (reduced ? REDUCED : v);

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
      variants={pick(pageVariants, reduced)}
      initial="hidden"
      animate="show"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}

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
        variants={pick(fadeScale, reduced)}
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

export const Rise = forwardRef<HTMLDivElement, MotionBoxProps>(function Rise(
  { children, className, delay = 0, ...props },
  ref,
) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      ref={ref}
      className={className}
      variants={pick(rise, reduced)}
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
      variants={pick(v, reduced)}
      initial="hidden"
      animate="show"
      exit="exit"
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

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
        variants={pick(rise, reduced)}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);

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
        variants={pick(rise, reduced)}
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
