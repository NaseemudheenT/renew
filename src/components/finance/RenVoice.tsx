"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { X, Mic, ArrowUp, Keyboard, MessageSquareText } from "lucide-react";
import { RenLogo } from "@/components/brand/RenLogo";
import { useRenBrain, type RenTurn } from "@/hooks/useRenBrain";
import { listen, speak, stopSpeaking, isVoiceSupported, speechOutputSupported, type Listener } from "@/lib/voice";
import { useUserProfile } from "@/hooks/useUserProfile";
import type { AskContext } from "@/lib/ask";
import { cn } from "@/lib/utils";

type Phase = "idle" | "listening" | "thinking" | "speaking";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Ren, the Siri way. This is what the floating orb opens EVERYWHERE except
 * Settings — a calm, voice-first moment: one big living orb, you speak, Ren
 * answers out loud, and it's gone. No message history, no chat clutter (the full
 * conversation lives in Settings › Ren). There's a quiet "type instead" fallback
 * for when a mic isn't available. It shares Ren's one brain via useRenBrain, so
 * spoken answers are identical to the chat's.
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
      speak(res.text, { voiceURI: profile?.renVoiceURI, rate: profile?.renVoiceRate, onEnd: () => setPhase("idle") });
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
    const t = setTimeout(() => startListening(), 260); // let the sheet settle first
    return () => { clearTimeout(t); stopMic(); stopSpeaking(); };
  }, [open, startListening, stopMic]);

  useEffect(() => { if (typing) inputRef.current?.focus(); }, [typing]);

  function toggleMic() {
    if (phase === "listening") { stopMic(); setPhase("idle"); return; }
    stopSpeaking();
    startListening();
  }

  const status =
    phase === "listening" ? "Listening…" :
    phase === "thinking" ? "Thinking…" :
    phase === "speaking" ? "Ren" :
    reply ? "Ren" : "Tap to speak";

  const caption = phase === "listening"
    ? (heard || "Say what you spent, or ask anything about your money.")
    : (reply || "Hi, I’m Ren. How can I help with your money?");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog" aria-modal="true" aria-label="Ren, your finance assistant"
          className="fixed inset-0 z-[120] flex flex-col items-center justify-center px-6"
          style={{ background: "color-mix(in oklab, var(--bg-base) 78%, transparent)", backdropFilter: "blur(28px) saturate(1.3)" }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Ambient champagne glow */}
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-[34%] size-[46vmax] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]"
            style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--color-gold-500) 32%, transparent), transparent 66%)" }} />

          {/* Close */}
          <button type="button" onClick={onClose} aria-label="Close"
            className="absolute end-5 top-[calc(env(safe-area-inset-top)+1.25rem)] grid size-10 place-items-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--glass-bg-soft)] hover:text-[var(--text-strong)]">
            <X className="size-5" />
          </button>

          {/* Everything below is inside the sheet — stop backdrop-close from firing */}
          <div className="relative flex w-full max-w-md flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <VoiceOrb phase={phase} />

            <p className="text-muted mt-8 text-xs font-medium uppercase tracking-wide">{status}</p>

            <AnimatePresence mode="wait">
              <motion.p
                key={caption}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.32, ease: EASE }}
                className={cn("mt-3 min-h-[3.5rem] max-w-sm text-center text-lg font-light leading-snug",
                  phase === "listening" && !heard ? "text-muted" : "text-strong")}>
                {caption}
              </motion.p>
            </AnimatePresence>

            {/* Text fallback (no mic, or the user chose to type) */}
            {typing ? (
              <form onSubmit={(e) => { e.preventDefault(); const v = input; setInput(""); void send(v); }}
                className="mt-6 flex w-full items-center gap-2">
                <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tell Ren, or ask…" aria-label="Message Ren"
                  className="text-strong h-12 min-w-0 flex-1 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg-soft)] px-5 text-sm outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--focus-ring)]" />
                <button type="submit" disabled={!input.trim()} aria-label="Send"
                  className="grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[var(--color-gold-300)] to-[var(--color-gold-500)] text-[var(--text-onGold)] shadow-[0_6px_20px_-6px_var(--color-gold-500)] transition-all active:scale-95 disabled:opacity-40">
                  <ArrowUp className="size-5" />
                </button>
              </form>
            ) : (
              <div className="mt-8 flex items-center gap-3">
                {voiceIn && (
                  <button type="button" onClick={toggleMic} aria-label={phase === "listening" ? "Stop listening" : "Speak to Ren"} aria-pressed={phase === "listening"}
                    className={cn("relative grid size-16 place-items-center rounded-full transition-all active:scale-95",
                      phase === "listening" ? "bg-rose-500 text-white shadow-[0_0_28px_rgba(244,63,94,0.5)]" : "bg-[var(--glass-bg-strong)] text-[var(--color-gold-500)] shadow-[0_8px_24px_-8px_var(--color-gold-500)] hover:-translate-y-0.5")}>
                    {phase === "listening" && <span className="absolute inset-0 animate-ping rounded-full bg-rose-500/40" />}
                    <Mic className="relative size-6" />
                  </button>
                )}
                <button type="button" onClick={() => { stopMic(); setPhase("idle"); setTyping(true); }} aria-label="Type instead"
                  className="grid size-12 place-items-center rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg-soft)] text-[var(--text-muted)] transition-colors hover:text-[var(--text-strong)]">
                  <Keyboard className="size-5" />
                </button>
              </div>
            )}

            {/* Full conversation lives in Settings › Ren */}
            <button type="button" onClick={() => { onClose(); router.push("/settings#ren"); }}
              className="text-muted mt-10 inline-flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-[var(--text-strong)]">
              <MessageSquareText className="size-3.5" /> Open the full conversation
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** The living orb — Ren's face. It breathes when idle, ripples while listening,
 *  spins-glows while thinking, and pulses in time while speaking. */
function VoiceOrb({ phase }: { phase: Phase }) {
  const rings = phase === "listening" || phase === "speaking";
  return (
    <div className="relative grid size-44 place-items-center">
      {rings && [0, 1, 2].map((i) => (
        <motion.span key={i} aria-hidden className="absolute rounded-full"
          style={{ width: 120, height: 120, border: "1.5px solid var(--color-gold-400)" }}
          initial={{ scale: 0.85, opacity: 0.55 }}
          animate={{ scale: 2.1, opacity: 0 }}
          transition={{ duration: phase === "listening" ? 2.4 : 1.6, delay: i * (phase === "listening" ? 0.8 : 0.5), repeat: Infinity, ease: "easeOut" }}
        />
      ))}
      <motion.div
        className="relative"
        animate={
          phase === "thinking" ? { scale: [1, 1.05, 1], rotate: 360 } :
          phase === "speaking" ? { scale: [1, 1.09, 0.98, 1.06, 1] } :
          phase === "listening" ? { scale: [1, 1.06, 1] } :
          { scale: [1, 1.035, 1] }
        }
        transition={
          phase === "thinking" ? { scale: { duration: 1.1, repeat: Infinity, ease: "easeInOut" }, rotate: { duration: 6, repeat: Infinity, ease: "linear" } } :
          phase === "speaking" ? { duration: 0.9, repeat: Infinity, ease: "easeInOut" } :
          phase === "listening" ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } :
          { duration: 3.4, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <RenLogo size={128} idSuffix="voice" />
      </motion.div>
    </div>
  );
}
