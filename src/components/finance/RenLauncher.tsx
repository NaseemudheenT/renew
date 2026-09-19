"use client";

import { useEffect, useState } from "react";
import { RenVoice } from "@/components/finance/RenVoice";
import { useRenContext } from "@/hooks/useRenContext";
import { REN_OPEN_EVENT } from "@/lib/ren-open";

/**
 * Ren's host. There's no floating orb any more — Ren is opened from the menu
 * panel ("Ask Ren") via REN_OPEN_EVENT, which this component listens for and
 * uses to open the Siri-style voice moment (RenVoice). Kept mounted on every
 * signed-in screen so Ren is always one tap away from the menu, without adding
 * a floating button over the content.
 */
export function RenLauncher() {
  const [open, setOpen] = useState(false);
  const { ctx, uid } = useRenContext();

  useEffect(() => {
    const openRen = () => setOpen(true);
    window.addEventListener(REN_OPEN_EVENT, openRen);
    // Deep link: /dashboard?ren=1 (a PWA shortcut, Apple Shortcut or Back Tap)
    // opens Ren straight away, then cleans the URL so a refresh doesn't reopen it.
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get("ren") === "1") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOpen(true);
        url.searchParams.delete("ren");
        window.history.replaceState({}, "", url.pathname + url.search + url.hash);
      }
    } catch { /* ignore */ }
    return () => window.removeEventListener(REN_OPEN_EVENT, openRen);
  }, []);

  return <RenVoice open={open} onClose={() => setOpen(false)} uid={uid} ctx={ctx} />;
}
