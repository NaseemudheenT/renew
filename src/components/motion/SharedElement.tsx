"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef, type ReactNode } from "react";

export interface SharedElementProps extends HTMLMotionProps<"div"> {
  id: string;
  children: ReactNode;
}

/** Shared-element transition anchor (same `id` in origin + destination). */
export const SharedElement = forwardRef<HTMLDivElement, SharedElementProps>(
  function SharedElement({ id, children, ...props }, ref) {
    return (
      <motion.div ref={ref} layoutId={id} {...props}>
        {children}
      </motion.div>
    );
  },
);
