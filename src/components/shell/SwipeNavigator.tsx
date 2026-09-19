"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Page transition wrapper. Each route slides/fades in gently (enter-only, keyed
 * by pathname — no App-Router exit flash).
 *
 * NOTE: horizontal swipe-to-change-page was removed by design — it made the
 * whole page feel like it was dragging whenever you swiped a row or a control.
 * In-content gestures (swipe a bottom sheet DOWN to dismiss, swipe the menu to
 * close) live on those components, not here, so a swipe only ever does the one
 * thing you'd expect in that spot.
 */
export function SwipeNavigator({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();

  if (reduced) return <div className="min-h-full">{children}</div>;

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: EASE }}
      className="min-h-full"
    >
      {children}
    </motion.div>
  );
}
