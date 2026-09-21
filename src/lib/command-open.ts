"use client";

/**
 * Open the global command palette from anywhere (the top-bar search pill, a
 * shortcut). CommandPalette listens for this event; using a window event keeps
 * its state local while any component can summon it — the "operating system"
 * feel made literal.
 */
export const COMMAND_OPEN_EVENT = "renew:command-open";

export function openCommand(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(COMMAND_OPEN_EVENT));
}
