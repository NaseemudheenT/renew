"use client";

import { useSyncExternalStore } from "react";

export type EnvironmentTier = "full3d" | "lite3d" | "soft2d";

let cachedWebGL: boolean | null = null;

/**
 * A rough "this device can afford the full atmosphere" check. Weak phones/laptops
 * still get the live WebGL gradient (GPU-cheap), but skip the heavy main-thread
 * aurora blur animations. Uses only widely-available, privacy-safe signals.
 */
function isLowPowerDevice(): boolean {
  if (typeof navigator === "undefined") return true;
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  if (nav.connection?.saveData) return true;
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4) return true;
  if (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 4) return true;
  return false;
}

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
  // WebGL is available: full atmosphere on capable devices, a lighter (no heavy
  // animated blur) variant on low-power ones so phones stay smooth.
  return isLowPowerDevice() ? "lite3d" : "full3d";
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
