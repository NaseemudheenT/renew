"use client";

import { useSyncExternalStore } from "react";

/**
 * SSR-safe media-query hook. Server + first paint return `false`, then we
 * upgrade after mount — so hydration is always stable.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      if (typeof window === "undefined") return () => {};
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => {
      if (typeof window === "undefined") return false;
      return window.matchMedia(query).matches;
    },
    () => false,
  );
}

/** Renew breakpoints (mobile-first). Match Tailwind's defaults intentionally. */
export const bp = {
  sm: "(min-width: 40rem)", // 640
  md: "(min-width: 48rem)", // 768
  lg: "(min-width: 64rem)", // 1024
  xl: "(min-width: 80rem)", // 1280
} as const;

/** True on tablet-and-up (>= md). Below this we use the mobile shell. */
export function useIsDesktop(): boolean {
  return useMediaQuery(bp.lg);
}

/** True on phones (< md). */
export function useIsMobile(): boolean {
  return !useMediaQuery(bp.md);
}
