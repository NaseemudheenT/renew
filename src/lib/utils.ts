import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names, resolving conflicts predictably.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** True when running in the browser. */
export const isBrowser = typeof window !== "undefined";

/** Clamp a number into an inclusive range. */
export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/** Small helper for guaranteed-unique client ids without pulling in a dep. */
export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

/** Promise-based delay. */
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
