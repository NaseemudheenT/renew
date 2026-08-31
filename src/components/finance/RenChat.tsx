"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X, Mic, ArrowUp, Volume2, VolumeX, Square } from "lucide-react";
import { answerQuestion, type AskContext } from "@/lib/ask";
import { parseMoneyCommand } from "@/lib/ren";
import { listen, speak, stopSpeaking, isVoiceSupported, speechOutputSupported, type Listener } from "@/lib/voice";
import { createTransaction, deleteTransaction } from "@/lib/firestore/transactions";
import { nowMs } from "@/lib/dates";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useCategories } from "@/hooks/useCategories";
import { toast } from "@/components/ui/toast-store";
import { cn } from "@/lib/utils";

interface Msg { id: string; role: "user" | "ren"; text: string; amount?: number; currency?: string }

const CHIPS = ["Spent 200 on lunch", "How much did I spend this month?", "How much can I spend?", "What's my net worth?", "Am I on track?"];
const EASE = [0.22, 1, 0.36, 1] as const;

let msgSeq = 0;
const nextId = () => `m${++msgSeq}`;

/**
 * Ren — Renew's finance assistant. Type or speak: record money ("spent 500 on
 * groceries") or ask about it ("how much did I spend?"). Deterministic, from the
 * person's own data, and can be spoken back. No LLM, no network. A floating,
 * premium panel with a living voice orb — Siri-calm, in Renew's champagne style.
 */
export function RenChat({
  open, onClose, ctx, uid,
}: {
  open: boolean;
  onClose: () => void;
  ctx: Omit<AskContext, "now">;
  uid: string | null;
}) {
  const { money } = useLocale();
  const { resolve } = useCategories();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [speakOn, setSpeakOn] = useState(true);
  const listenerRef = useRef<Listener | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const voiceIn = isVoiceSupported();
  const voiceOut = speechOutputSupported();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open]);

  useEffect(() => {
    // Stop mic + voice whenever Ren closes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!open) { listenerRef.current?.stop(); stopSpeaking(); setListening(false); }
  }, [open]);

  function push(m: Omit<Msg, "id">) { setMsgs((prev) => [...prev, { id: nextId(), ...m }]); }
  function say(text: string) { if (speakOn && voiceOut) speak(text); }

  function respond(text: string, extra?: { amount?: number; currency?: string }) {
    push({ role: "ren", text, ...extra });
    say(text);
  }

  function handle(raw: string) {
    const text = raw.trim();
    if (!text) return;
    push({ role: "user", text });
    setInput("");

    // 1) A command to record money?
    const draft = parseMoneyCommand(text);
    if (draft && uid) {
      const label = resolve(draft.category).label;
      const note = draft.note || label;
      createTransaction(uid, { type: draft.type, amount: draft.amount, currency: ctx.currency, category: draft.category, note, date: nowMs() })
        .then((id) => {
          const line = draft.type === "income"
            ? `Added ${money(draft.amount, ctx.currency)} income to ${label}.`
            : `Added ${money(draft.amount, ctx.currency)} to ${label}.`;
          respond(line, { amount: draft.amount, currency: ctx.currency });
          toast({ title: "Added by Ren", variant: "success", action: { label: "Undo", onClick: () => deleteTransaction(uid, id).catch(() => {}) } });
        })
        .catch(() => respond("I couldn't save that just now — please try again."));
      return;
    }

    // 2) A question about their money?
    const a = answerQuestion(text, { ...ctx, now: nowMs() });
    if (a) {
      const line = a.value !== undefined
        ? `${a.title}: ${money(a.value, a.currency ?? ctx.currency)}.${a.detail ? " " + a.detail : ""}`
        : (a.detail ?? a.title);
      respond(line, a.value !== undefined ? { amount: a.value, currency: a.currency ?? ctx.currency } : undefined);
      return;
    }

    // 3) Didn't understand.
    respond("I can add money — say “spent 500 on groceries” — or answer things like “how much did I spend this month?”");
  }

  function toggleMic() {
    if (listening) { listenerRef.current?.stop(); setListening(false); return; }
    stopSpeaking();
    const l = listen({
      onText: (t) => { setInput(t); handle(t); },
      onEnd: () => setListening(false),
      onError: () => setListening(false),
    });
    if (l) { listenerRef.current = l; setListening(true); }
    else toast({ title: "Voice isn't available in this browser", variant: "error" });
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} aria-hidden />
          <motion.div
            role="dialog" aria-label="Ren, your finance assistant"
            className="fixed inset-x-0 bottom-0 z-50 mx-auto flex h-[86dvh] max-w-2xl flex-col overflow-hidden rounded-t-[2rem] sm:inset-x-4 sm:bottom-4 sm:h-[78dvh] sm:rounded-[2rem] lg:inset-x-auto lg:left-1/2 lg:w-[40rem] lg:-translate-x-1/2"
            initial={{ y: 40, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            style={{ background: "var(--glass-bg-strong)", boxShadow: "var(--glass-shadow), 0 40px 120px -20px rgba(0,0,0,0.6)", border: "1px solid var(--glass-border)", backdropFilter: "blur(28px) saturate(1.4)" }}
          >
            {/* Ambient champagne glow */}
            <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(212,175,110,0.28),transparent_65%)] blur-2xl" />

            {/* Header */}
            <div className="relative flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <RenMark active={listening} />
                <div>
                  <h2 className="text-strong text-base font-medium leading-tight">Ren</h2>
                  <p className="text-muted text-xs">{listening ? "Listening…" : "Your finance assistant"}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {voiceOut && (
                  <button type="button" onClick={() => { setSpeakOn((v) => { if (v) stopSpeaking(); return !v; }); }} aria-pressed={speakOn} aria-label={speakOn ? "Turn voice off" : "Turn voice on"}
                    className="grid size-9 place-items-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--glass-bg-soft)] hover:text-[var(--text-strong)]">
                    {speakOn ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
                  </button>
                )}
                <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--glass-bg-soft)] hover:text-[var(--text-strong)]"><X className="size-5" /></button>
              </div>
            </div>

            {/* Body */}
            <div ref={scrollRef} className="relative flex-1 overflow-y-auto overscroll-contain px-5 py-2">
              <AnimatePresence mode="wait">
                {listening ? (
                  <motion.div key="orb" className="flex h-full flex-col items-center justify-center gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <VoiceOrb />
                    <p className="text-body text-sm">I&apos;m listening — say what you spent, or ask a question.</p>
                  </motion.div>
                ) : msgs.length === 0 ? (
                  <motion.div key="hero" className="flex h-full flex-col items-center justify-center gap-4 text-center" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <RenMark large />
                    <div>
                      <p className="text-strong text-base font-medium">Hi, I&apos;m Ren.</p>
                      <p className="text-muted mx-auto mt-1 max-w-xs text-sm">Tell me what you spent, or ask anything about your money. It all stays on your device.</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="chat" className="space-y-3 py-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {msgs.map((m) => (
                      <motion.div key={m.id} initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.32, ease: EASE }}
                        className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                        <div className={cn("max-w-[86%] rounded-3xl px-4 py-2.5 text-sm leading-relaxed",
                          m.role === "user"
                            ? "rounded-br-lg bg-gradient-to-br from-[var(--color-gold-300)] to-[var(--color-gold-500)] text-[var(--text-onGold)]"
                            : "rounded-bl-lg border border-[var(--glass-border)] bg-[var(--glass-bg-soft)] text-[var(--text-body)]")}>
                          {m.text}
                          {m.amount !== undefined && (
                            <span className={cn("mt-1 block text-2xl font-light tabular-nums", m.role === "user" ? "text-[var(--text-onGold)]" : "text-strong")}>{money(m.amount, m.currency ?? ctx.currency)}</span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Chips before first message */}
            {msgs.length === 0 && !listening && (
              <div className="flex flex-wrap gap-2 px-5 pb-2">
                {CHIPS.map((c, i) => (
                  <motion.button key={c} type="button" onClick={() => handle(c)}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i, ease: EASE }}
                    className="text-body rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg-soft)] px-3 py-1.5 text-xs font-medium transition-all hover:-translate-y-0.5 hover:border-[var(--focus-ring)]/50 hover:text-[var(--text-strong)]">{c}</motion.button>
                ))}
              </div>
            )}

            {/* Composer */}
            <form onSubmit={(e) => { e.preventDefault(); handle(input); }} className="flex items-center gap-2 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3">
              {voiceIn && (
                <button type="button" onClick={toggleMic} aria-label={listening ? "Stop listening" : "Speak to Ren"} aria-pressed={listening}
                  className={cn("relative grid size-12 shrink-0 place-items-center rounded-full transition-all active:scale-95",
                    listening ? "bg-rose-500 text-white shadow-[0_0_24px_rgba(244,63,94,0.5)]" : "bg-[var(--glass-bg-soft)] text-[var(--color-gold-500)] hover:bg-[var(--glass-bg-strong)]")}>
                  {listening && <span className="absolute inset-0 animate-ping rounded-full bg-rose-500/40" />}
                  {listening ? <Square className="relative size-4" /> : <Mic className="relative size-5" />}
                </button>
              )}
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={listening ? "Listening…" : "Tell Ren, or ask…"} aria-label="Message Ren"
                className="text-strong h-12 min-w-0 flex-1 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg-soft)] px-5 text-sm outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--focus-ring)]" />
              <button type="submit" disabled={!input.trim()} aria-label="Send" className="grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[var(--color-gold-300)] to-[var(--color-gold-500)] text-[var(--text-onGold)] shadow-[0_6px_20px_-6px_var(--color-gold-500)] transition-all hover:-translate-y-0.5 active:scale-95 disabled:translate-y-0 disabled:opacity-40"><ArrowUp className="size-5" /></button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Ren's mark — a champagne sparkle that softly breathes; pulses when active. */
function RenMark({ large, active }: { large?: boolean; active?: boolean }) {
  const size = large ? "size-16" : "size-9";
  return (
    <motion.span
      className={cn("relative grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[var(--glass-bg-strong)] to-[var(--glass-bg-soft)]", size)}
      animate={active ? { scale: [1, 1.06, 1] } : { scale: 1 }}
      transition={active ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
      style={{ border: "1px solid var(--glass-border)" }}
    >
      <span aria-hidden className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_50%_30%,rgba(212,175,110,0.35),transparent_70%)]" />
      <Sparkles className={cn("relative text-[var(--color-gold-500)]", large ? "size-8" : "size-4.5")} />
    </motion.span>
  );
}

/** The listening orb — concentric champagne rings breathing outward, Siri-calm. */
function VoiceOrb() {
  return (
    <div className="relative grid size-40 place-items-center">
      {[0, 1, 2].map((i) => (
        <motion.span key={i} aria-hidden className="absolute rounded-full"
          style={{ width: 128, height: 128, border: "1.5px solid var(--color-gold-400)" }}
          initial={{ scale: 0.9, opacity: 0.5 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 2.6, delay: i * 0.85, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
      <motion.span
        className="relative grid size-32 place-items-center rounded-full"
        style={{ background: "radial-gradient(circle at 32% 28%, var(--color-gold-300), var(--color-gold-500) 70%)", boxShadow: "0 0 60px -6px var(--color-gold-500)" }}
        animate={{ scale: [1, 1.07, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <Mic className="size-11 text-white/90" />
      </motion.span>
    </div>
  );
}
