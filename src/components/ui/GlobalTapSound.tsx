"use client";

import { useEffect } from "react";
import { playTap } from "@/lib/sound";

/**
 * Plays the soft liquid-glass tap on ANY interactive control across Renew — one
 * consistent, barely-there sound whether you press a button, a menu item, a nav
 * tab or a card. Respects the user's sound setting (playTap checks it) and the
 * reduced-motion/no-audio fallbacks inside playTap.
 */
const INTERACTIVE =
  'button, [role="button"], [role="menuitem"], [role="option"], [role="tab"], [role="switch"], a[href], .pressable';

export function GlobalTapSound() {
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      const el = target?.closest(INTERACTIVE);
      if (!el || el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true") return;
      playTap();
    };
    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);
  return null;
}
