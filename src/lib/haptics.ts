"use client";

/**
 * A tiny, safe haptic tap for key moments (add, unlock, keypad) — makes the app
 * feel physical on phones that support the Vibration API. A no-op everywhere
 * else; never throws.
 */
export function haptic(pattern: number | number[] = 10): void {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(pattern);
    }
  } catch {
    /* haptics are a nicety — ignore */
  }
}

/** A gentle two-pulse for a successful action. */
export const HAPTIC_SUCCESS = [12, 40, 12];
