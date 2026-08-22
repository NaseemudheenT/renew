"use client";

import { useSyncExternalStore } from "react";

export type EnvironmentTier = "full3d" | "soft2d";

let cachedWebGL: boolean | null = null;

/** Detect WebGL support once (creating a throwaway context). */
function hasWebGL(): boolean {
  if (cachedWebGL !== null) return cachedWebGL;
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ??
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl");
    cachedWebGL = Boolean(gl);
  } catch {
    cachedWebGL = false;
  }
  return cachedWebGL;
}

function computeTier(): EnvironmentTier {
  if (typeof window === "undefined") return "soft2d";
  const reduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  // Phones are first-class here — the living background must run there too, so we
  // no longer gate on screen width. Only reduced-motion or missing WebGL falls
  // back to the calm static field.
  if (reduced || !hasWebGL()) return "soft2d";
  return "full3d";
}

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const onResize = () => callback();
  mqMotion.addEventListener("change", callback);
  window.addEventListener("resize", onResize);
  return () => {
    mqMotion.removeEventListener("change", callback);
    window.removeEventListener("resize", onResize);
  };
}

/**
 * SSR-safe environment tier. Server + first client paint return "soft2d";
 * after mount we upgrade to "full3d" when the device can handle it. This keeps
 * hydration stable and guarantees a graceful fallback everywhere.
 */
export function useEnvironmentTier(): EnvironmentTier {
  return useSyncExternalStore(subscribe, computeTier, () => "soft2d");
}

/** SSR-safe reduced-motion flag. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (cb) => {
      if (typeof window === "undefined") return () => {};
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}
