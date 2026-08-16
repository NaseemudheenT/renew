"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef, type ReactNode } from "react";

export interface SharedElementProps extends HTMLMotionProps<"div"> {
  /** The shared layout id — same value in origin and destination. */
  id: string;
  children: ReactNode;
}

/**
 * A shared-element transition anchor. Render the same `id` in two places
 * (e.g. a card and its opened detail) inside a common <LayoutGroup> or route,
 * and Framer Motion tweens between them.
 */
export const SharedElement = forwardRef<HTMLDivElement, SharedElementProps>(
  function SharedElement({ id, children, ...props }, ref) {
    return (
      <motion.div ref={ref} layoutId={id} {...props}>
        {children}
      </motion.div>
    );
  },
);
