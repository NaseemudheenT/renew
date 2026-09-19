"use client";

import { useEffect, useState } from "react";
import { RenVoice } from "@/components/finance/RenVoice";
import { RenChat } from "@/components/finance/RenChat";
import { RenChoice } from "@/components/finance/RenChoice";
import { useRenContext } from "@/hooks/useRenContext";
import { REN_OPEN_EVENT } from "@/lib/ren-open";

type Mode = null | "choice" | "voice" | "chat";

/**
 * Ren's host. Opening Ren (from the menu's "Ask Ren" or the /dashboard?ren=1
 * deep link) shows a choice — Speak with Ren (Siri-style voice) or Chat with Ren
 * (text) — then routes into the chosen surface. No floating orb over content.
 */
export function RenLauncher() {
  const [mode, setMode] = useState<Mode>(null);
  const { ctx, uid } = useRenContext();

  useEffect(() => {
    const openRen = () => setMode("choice");
    window.addEventListener(REN_OPEN_EVENT, openRen);
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get("ren") === "1") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMode("choice");
        url.searchParams.delete("ren");
        window.history.replaceState({}, "", url.pathname + url.search + url.hash);
      }
    } catch { /* ignore */ }
    return () => window.removeEventListener(REN_OPEN_EVENT, openRen);
  }, []);

  return (
    <>
      <RenChoice
        open={mode === "choice"}
        onSpeak={() => setMode("voice")}
        onChat={() => setMode("chat")}
        onClose={() => setMode(null)}
      />
      <RenVoice open={mode === "voice"} onClose={() => setMode(null)} uid={uid} ctx={ctx} />
      <RenChat open={mode === "chat"} onClose={() => setMode(null)} uid={uid} ctx={ctx} />
    </>
  );
}
