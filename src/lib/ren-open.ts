"use client";

/**
 * A tiny, dependency-free way to open Ren from anywhere (the menu panel, a
 * shortcut, an empty-state prompt). RenLauncher listens for this event and opens
 * the Siri-style voice moment. Using a window event keeps the launcher's state
 * local while letting any component summon Ren without prop-drilling a store.
 */
export const REN_OPEN_EVENT = "renew:ren-open";

/** Open Ren, the finance assistant. No-op during SSR. */
export function openRen(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(REN_OPEN_EVENT));
}
