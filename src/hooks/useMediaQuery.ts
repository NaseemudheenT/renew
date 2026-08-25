"use client";

import { useSyncExternalStore } from "react";

/** SSR-safe media-query hook (defaults to false on the server). */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      if (typeof window === "undefined" || !window.matchMedia) return () => {};
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(query).matches : false),
    () => false,
  );
}

/** True on phone-width viewports (< 640px). */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 639px)");
}
