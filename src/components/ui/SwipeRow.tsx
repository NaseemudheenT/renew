"use client";

import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useTransform, animate, type PanInfo } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SwipeAction {
  label: string;
  icon: LucideIcon;
  /** Tailwind background for the revealed panel, e.g. "bg-emerald-500". */
  bg: string;
  onTrigger: () => void;
}

/**
 * A touch-first swipeable row: drag right to trigger the "right" action (e.g.
 * Pay), drag left to trigger the "left" action (e.g. Delete). The coloured
 * action panel is revealed behind the row as you drag; releasing past the
 * threshold fires it, otherwise the row springs back. Fully keyboard/desktop
 * safe — the row's own buttons/menus still work; this is an additive shortcut.
 */
export function SwipeRow({
  children,
  swipeRight,
  swipeLeft,
  className,
}: {
  children: ReactNode;
  swipeRight?: SwipeAction;
  swipeLeft?: SwipeAction;
  className?: string;
}) {
  const x = useMotionValue(0);
  const dragging = useRef(false);
  const THRESHOLD = 88;

  // Reveal panels track the drag: right-action sits on the left edge (shown when
  // dragging right); left-action sits on the right edge (shown when dragging left).
  const rightOpacity = useTransform(x, [0, 40], [0, 1]);
  const leftOpacity = useTransform(x, [-40, 0], [1, 0]);
  const RightIcon = swipeRight?.icon;
  const LeftIcon = swipeLeft?.icon;

  function onDragEnd(_: unknown, info: PanInfo) {
    dragging.current = false;
    const dx = info.offset.x;
    if (swipeRight && dx > THRESHOLD) {
      animate(x, 0, { type: "spring", stiffness: 500, damping: 40 });
      swipeRight.onTrigger();
    } else if (swipeLeft && dx < -THRESHOLD) {
      animate(x, 0, { type: "spring", stiffness: 500, damping: 40 });
      swipeLeft.onTrigger();
    } else {
      animate(x, 0, { type: "spring", stiffness: 500, damping: 40 });
    }
  }

  return (
    <div className={cn("relative overflow-hidden rounded-2xl", className)}>
      {/* Right action (Pay) — left edge */}
      {swipeRight && RightIcon && (
        <motion.div
          style={{ opacity: rightOpacity }}
          className={cn("absolute inset-y-0 left-0 flex w-24 items-center gap-2 rounded-2xl px-4 text-sm font-semibold text-white", swipeRight.bg)}
        >
          <RightIcon className="size-4" />
          {swipeRight.label}
        </motion.div>
      )}
      {/* Left action (Delete) — right edge */}
      {swipeLeft && LeftIcon && (
        <motion.div
          style={{ opacity: leftOpacity }}
          className={cn("absolute inset-y-0 right-0 flex w-24 items-center justify-end gap-2 rounded-2xl px-4 text-sm font-semibold text-white", swipeLeft.bg)}
        >
          {swipeLeft.label}
          <LeftIcon className="size-4" />
        </motion.div>
      )}
      <motion.div
        drag="x"
        style={{ x }}
        dragConstraints={{ left: swipeLeft ? -120 : 0, right: swipeRight ? 120 : 0 }}
        dragElastic={0.12}
        dragDirectionLock
        onDragStart={() => { dragging.current = true; }}
        onDragEnd={onDragEnd}
        className="relative touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
}
