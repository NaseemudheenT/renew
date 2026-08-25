"use client";

import { useSyncExternalStore } from "react";

/**
 * How Renew is being viewed. Renew is one adaptive codebase that behaves per
 * device: a plain browser tab (where we can offer "scan a QR to sign in another
 * device") vs an INSTALLED app — a PWA added to the home screen, or the native
 * App/Play Store wrapper — which runs standalone and should feel like a native app.
 */

export function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const mm = window.matchMedia;
  const standaloneDisplay =
    !!mm &&
    (mm("(display-mode: standalone)").matches ||
      mm("(display-mode: fullscreen)").matches ||
      mm("(display-mode: minimal-ui)").matches ||
      mm("(display-mode: window-controls-overlay)").matches);
  // iOS Safari (added to Home Screen) exposes navigator.standalone instead.
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return standaloneDisplay || iosStandalone;
}

function subscribe(cb: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const queries = [
    "(display-mode: standalone)",
    "(display-mode: fullscreen)",
    "(display-mode: minimal-ui)",
    "(display-mode: window-controls-overlay)",
  ].map((q) => window.matchMedia(q));
  queries.forEach((m) => m.addEventListener?.("change", cb));
  return () => queries.forEach((m) => m.removeEventListener?.("change", cb));
}

/** True when Renew runs as an installed app (PWA/home-screen/native wrapper). */
export function useIsStandalone(): boolean {
  return useSyncExternalStore(subscribe, detectStandalone, () => false);
}

/** True when Renew runs in an ordinary browser tab (not installed). */
export function useIsBrowser(): boolean {
  return !useIsStandalone();
}
