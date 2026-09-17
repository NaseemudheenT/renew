"use client";

import { useRef, useState, type ReactNode, type TouchEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { navItemsFor } from "@/lib/nav";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { haptic } from "@/lib/haptics";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Native-app feel: swipe left/right anywhere on the page to move between the
 * main sections (Overview → Accounts → Transactions → …), and every route change
 * slides in like a real app. Vertical scrolling is untouched — only a decisive,
 * mostly-horizontal swipe navigates. Swipes that start on inputs, sliders or a
 * horizontally-scrolling strip (charts, chip rows) are ignored, and the whole
 * thing stills under reduced-motion.
 */
export function SwipeNavigator({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const reduced = useReducedMotion();
  const { mode } = useWorkspace();
  // Settings is reached from the account, so it isn't part of the swipe run.
  const items = navItemsFor(mode).filter((i) => i.href !== "/settings");
  const idx = items.findIndex((i) => pathname === i.href || pathname.startsWith(i.href + "/"));

  const start = useRef<{ x: number; y: number; t: number } | null>(null);
  const [dir, setDir] = useState(0); // -1 = went back, 1 = went forward (slide dir)

  function onTouchStart(e: TouchEvent) {
    const t = e.touches[0];
    if (!t) return;
    start.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  }

  function onTouchEnd(e: TouchEvent) {
    const s = start.current;
    start.current = null;
    if (!s || idx < 0) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    const dt = Date.now() - s.t;
    // Decisive, mostly-horizontal, reasonably quick — otherwise it's a scroll.
    if (Math.abs(dx) < 72 || Math.abs(dx) < Math.abs(dy) * 1.8 || dt > 600) return;
    // Never hijack a swipe that began on something scrollable/interactive.
    const el = e.target as HTMLElement | null;
    if (el?.closest?.("[data-noswipe],input,textarea,select,[role=slider],.overflow-x-auto,.overflow-auto")) return;
    const next = dx < 0 ? idx + 1 : idx - 1;
    if (next < 0 || next >= items.length) return;
    setDir(dx < 0 ? 1 : -1);
    haptic(8);
    router.push(items[next]!.href);
  }

  if (reduced) {
    return (
      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="min-h-full">
        {children}
      </div>
    );
  }

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="min-h-full">
      {/* Keyed by route → each page remounts and slides in (enter-only, so there's
          no App-Router exit flash). Direction follows the swipe. */}
      <motion.div
        key={pathname}
        initial={{ opacity: 0, x: dir * 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.26, ease: EASE }}
        className="min-h-full"
      >
        {children}
      </motion.div>
    </div>
  );
}
