"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { X, ArrowUp, MessageSquareText } from "lucide-react";
import { RenLogo } from "@/components/brand/RenLogo";
import { useRenBrain, type RenTurn } from "@/hooks/useRenBrain";
import { listen, speak, stopSpeaking, isVoiceSupported, speechOutputSupported, type Listener } from "@/lib/voice";
import { renVoiceSpeakOpts } from "@/lib/ren-voices";
import { useUserProfile } from "@/hooks/useUserProfile";
import type { AskContext } from "@/lib/ask";
import { cn } from "@/lib/utils";

type Phase = "idle" | "listening" | "thinking" | "speaking";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Ren, the Siri way. The floating orb opens this everywhere except Settings — a
 * calm, voice-first moment. The orb itself is the control: tap it to talk, tap
 * again to stop. It only moves while Ren is active (listening / thinking /
 * speaking) and rests perfectly still when silent. Ren's words appear below the
 * orb. No microphone icon, no chat clutter (the full conversation lives in
 * Settings › Ren). Ren replies in whatever language you speak, and out loud in
 * your chosen Ren voice. One shared brain via useRenBrain.
 */
export function RenVoice({
  open, onClose, ctx, uid,
}: {
  open: boolean;
  onClose: () => void;
  ctx: Omit<AskContext, "now">;
  uid: string | null;
}) {
  const router = useRouter();
  const { profile } = useUserProfile();
  const { ask } = useRenBrain(ctx, uid);

  const [phase, setPhase] = useState<Phase>("idle");
  const [heard, setHeard] = useState("");        // live transcript while listening
  const [reply, setReply] = useState("");        // Ren's last spoken line (caption)
  const [typing, setTyping] = useState(false);   // text-fallback mode
  const [input, setInput] = useState("");

  const listenerRef = useRef<Listener | null>(null);
  const historyRef = useRef<RenTurn[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const voiceIn = isVoiceSupported();
  const voiceOut = speechOutputSupported();
  const speakOn = (profile?.renAutoSpeak ?? true) && voiceOut;
  const active = phase !== "idle";

  const stopMic = useCallback(() => { listenerRef.current?.stop(); listenerRef.current = null; }, []);

  // Send one turn through Ren's brain and speak the answer.
  const send = useCallback(async (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    stopMic();
    setHeard(text);
    setPhase("thinking");
    historyRef.current = [...historyRef.current, { role: "user", text } as RenTurn].slice(-10);
    const res = await ask(text, historyRef.current);
    historyRef.current = [...historyRef.current, { role: "ren", text: res.text } as RenTurn].slice(-10);
    setReply(res.text);
    if (speakOn) {
      setPhase("speaking");
      speak(res.text, { ...renVoiceSpeakOpts(profile?.renVoiceURI), rate: profile?.renVoiceRate, onEnd: () => setPhase("idle") });
    } else {
      setPhase("idle");
    }
  }, [ask, speakOn, stopMic, profile?.renVoiceURI, profile?.renVoiceRate]);

  const startListening = useCallback(() => {
    if (!voiceIn) { setTyping(true); return; }
    stopSpeaking();
    setHeard("");
    setReply("");
    const l = listen({
      onPartial: (t) => setHeard(t),
      onText: (t) => { void send(t); },
      onEnd: () => setPhase((p) => (p === "listening" ? "idle" : p)),
      onError: () => setPhase("idle"),
    });
    if (l) { listenerRef.current = l; setPhase("listening"); }
    else { setTyping(true); }
  }, [voiceIn, send]);

  // Opening Ren starts a listening moment straight away (Siri-style). Closing
  // tears everything down so no mic or voice ever lingers. startListening resets
  // the heard/reply captions and phase, so the only synchronous reset here is the
  // typing fallback flag.
  useEffect(() => {
    if (!open) { stopMic(); stopSpeaking(); return; }
    historyRef.current = [];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTyping(false);
    const t = setTimeout(() => startListening(), 300); // let the sheet settle first
    return () => { clearTimeout(t); stopMic(); stopSpeaking(); };
  }, [open, startListening, stopMic]);

  useEffect(() => { if (typing) inputRef.current?.focus(); }, [typing]);

  // Tapping the orb is the whole control: talk / stop.
  function tapOrb() {
    if (phase === "listening") { stopMic(); setPhase("idle"); return; }
    if (phase === "speaking") { stopSpeaking(); setPhase("idle"); return; }
    if (typing) setTyping(false);
    startListening();
  }

  const status =
    phase === "listening" ? "Listening…" :
    phase === "thinking" ? "Thinking…" :
    phase === "speaking" ? "Ren" :
    reply ? "Ren" : "Tap to speak";

  const caption = phase === "listening"
    ? (heard || "Speak in any language — Ren understands.")
    : (reply || "Hi, I’m Ren. How can I help with your money?");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog" aria-modal="true" aria-label="Ren, your finance assistant"
          className="fixed inset-0 z-[120] flex flex-col items-center justify-center px-6"
          style={{ background: "color-mix(in oklab, var(--bg-base) 80%, transparent)", backdropFilter: "blur(30px) saturate(1.3)" }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Ambient glow that only breathes while Ren is active */}
          <motion.div aria-hidden className="pointer-events-none absolute left-1/2 top-[38%] size-[52vmax] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[110px]"
            style={{ background: "radial-gradient(circle, rgba(74,123,255,0.28), rgba(192,92,255,0.14), transparent 66%)" }}
            animate={active ? { opacity: [0.5, 0.85, 0.5], scale: [1, 1.06, 1] } : { opacity: 0.4, scale: 1 }}
            transition={active ? { duration: 3, repeat: Infinity, ease: "easeInOut" } : { duration: 0.6 }}
          />

          <button type="button" onClick={onClose} aria-label="Close"
            className="absolute end-5 top-[calc(env(safe-area-inset-top)+1.25rem)] grid size-10 place-items-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--glass-bg-soft)] hover:text-[var(--text-strong)]">
            <X className="size-5" />
          </button>

          {/* Sheet — stop backdrop-close from firing inside */}
          <div className="relative flex w-full max-w-md flex-col items-center" onClick={(e) => e.stopPropagation()}>
            {/* The orb IS the control. It moves only when active. */}
            <motion.button
              type="button"
              onClick={tapOrb}
              aria-label={phase === "listening" ? "Stop" : "Talk to Ren"}
              aria-pressed={phase === "listening"}
              className="relative grid place-items-center rounded-full outline-none"
              animate={{ y: active || reply ? -6 : 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 22 }}
              whileTap={{ scale: 0.97 }}
            >
              {/* Rings ripple outward only while listening / speaking */}
              {(phase === "listening" || phase === "speaking") && [0, 1, 2].map((i) => (
                <motion.span key={i} aria-hidden className="absolute rounded-full"
                  style={{ width: 150, height: 150, border: "1.5px solid rgba(127,208,255,0.6)" }}
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: phase === "listening" ? 2.4 : 1.6, delay: i * (phase === "listening" ? 0.8 : 0.5), repeat: Infinity, ease: "easeOut" }}
                />
              ))}
              <motion.span
                className="relative block"
                animate={
                  phase === "thinking" ? { scale: [1, 1.06, 1], rotate: [0, 4, -4, 0] } :
                  phase === "speaking" ? { scale: [1, 1.12, 0.97, 1.08, 1] } :
                  phase === "listening" ? { scale: [1, 1.09, 1] } :
                  { scale: 1 } // silent → perfectly still
                }
                transition={
                  phase === "thinking" ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" } :
                  phase === "speaking" ? { duration: 0.85, repeat: Infinity, ease: "easeInOut" } :
                  phase === "listening" ? { duration: 1.3, repeat: Infinity, ease: "easeInOut" } :
                  { duration: 0.4 }
                }
                style={{ filter: "drop-shadow(0 12px 40px rgba(74,123,255,0.45))" }}
              >
                <RenLogo size={148} idSuffix="voice" />
              </motion.span>
            </motion.button>

            <p className="text-muted mt-9 text-xs font-medium uppercase tracking-wide">{status}</p>

            {/* Ren's words — below the orb */}
            <AnimatePresence mode="wait">
              <motion.p
                key={caption}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.32, ease: EASE }}
                className={cn("mt-3 min-h-[3.5rem] max-w-sm text-center text-lg font-light leading-snug",
                  phase === "listening" && !heard ? "text-muted" : "text-strong")}>
                {caption}
              </motion.p>
            </AnimatePresence>

            {/* Text fallback — quiet, no microphone anywhere */}
            {typing ? (
              <form onSubmit={(e) => { e.preventDefault(); const v = input; setInput(""); void send(v); }}
                className="mt-4 flex w-full items-center gap-2">
                <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type to Ren…" aria-label="Message Ren"
                  className="text-strong h-12 min-w-0 flex-1 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg-soft)] px-5 text-sm outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--focus-ring)]" />
                <button type="submit" disabled={!input.trim()} aria-label="Send"
                  className="grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#4a7bff] to-[#c05cff] text-white shadow-[0_6px_20px_-6px_#4a7bff] transition-all active:scale-95 disabled:opacity-40">
                  <ArrowUp className="size-5" />
                </button>
              </form>
            ) : (
              <button type="button" onClick={() => { stopMic(); setPhase("idle"); setTyping(true); }}
                className="text-muted mt-6 text-sm font-medium transition-colors hover:text-[var(--text-strong)]">
                Type instead
              </button>
            )}

            <button type="button" onClick={() => { onClose(); router.push("/settings#ren"); }}
              className="text-muted mt-8 inline-flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-[var(--text-strong)]">
              <MessageSquareText className="size-3.5" /> Open the full conversation
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
