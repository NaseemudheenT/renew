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
    return () => window.removeEventListener(REN_OPEN_EVENT, openRen);
  }, []);

  return <RenVoice open={open} onClose={() => setOpen(false)} uid={uid} ctx={ctx} />;
}
