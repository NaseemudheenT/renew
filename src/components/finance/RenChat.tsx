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

let msgSeq = 0;
const nextId = () => `m${++msgSeq}`;

/**
 * Ren — Renew's finance assistant. Type or speak: record money ("spent 500 on
 * groceries") or ask about it ("how much did I spend?"). Every answer is
 * deterministic, from the person's own data, and can be spoken back. No LLM, no
 * network — it just knows Renew and your money.
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
          <motion.div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} aria-hidden />
          <motion.div
            role="dialog" aria-label="Ren, your finance assistant"
            className="glass fixed inset-x-0 bottom-0 z-50 mx-auto flex h-[85dvh] max-w-2xl flex-col !rounded-b-none !rounded-t-glass-lg p-0 sm:inset-x-4 sm:bottom-4 sm:h-[80dvh] lg:inset-x-auto lg:left-1/2 lg:w-[40rem] lg:-translate-x-1/2"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 320, damping: 34 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-[var(--glass-bg-strong)]"><Sparkles className="size-4.5 text-[var(--color-gold-500)]" /></span>
                <div>
                  <h2 className="text-strong text-base font-medium leading-tight">Ren</h2>
                  <p className="text-muted text-xs">Your finance assistant</p>
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

            {/* Transcript */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 py-4">
              {msgs.length === 0 && (
                <div className="text-muted flex h-full flex-col items-center justify-center gap-3 text-center">
                  <span className="grid size-14 place-items-center rounded-2xl bg-[var(--glass-bg-strong)]"><Sparkles className="size-7 text-[var(--color-gold-500)]" /></span>
                  <p className="text-body text-sm">Hi, I&apos;m Ren. Tell me what you spent, or ask me anything about your money.</p>
                  <p className="text-muted text-xs">Everything stays on your device.</p>
                </div>
              )}
              {msgs.map((m) => (
                <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm",
                    m.role === "user" ? "bg-[var(--glass-bg-strong)] text-[var(--text-strong)]" : "border border-[var(--field-border)] bg-[var(--field-bg)] text-[var(--text-body)]")}>
                    {m.text}
                    {m.amount !== undefined && (
                      <span className="text-strong mt-1 block text-2xl font-light tabular-nums">{money(m.amount, m.currency ?? ctx.currency)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Chips (only before the first message) */}
            {msgs.length === 0 && (
              <div className="flex flex-wrap gap-2 px-5 pb-2">
                {CHIPS.map((c) => (
                  <button key={c} type="button" onClick={() => handle(c)} className="text-body rounded-full border border-[var(--field-border)] bg-[var(--field-bg)] px-3 py-1.5 text-xs font-medium transition-colors hover:border-[var(--focus-ring)]/50 hover:text-[var(--text-strong)]">{c}</button>
                ))}
              </div>
            )}

            {/* Composer */}
            <form onSubmit={(e) => { e.preventDefault(); handle(input); }} className="flex items-center gap-2 border-t border-[var(--glass-border)] p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
              {voiceIn && (
                <button type="button" onClick={toggleMic} aria-label={listening ? "Stop listening" : "Speak to Ren"} aria-pressed={listening}
                  className={cn("grid size-11 shrink-0 place-items-center rounded-full transition-colors", listening ? "bg-rose-500 text-white" : "bg-[var(--glass-bg-strong)] text-[var(--color-gold-500)]")}>
                  {listening ? <Square className="size-4" /> : <Mic className="size-5" />}
                </button>
              )}
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={listening ? "Listening…" : "Tell Ren, or ask…"} aria-label="Message Ren"
                className="text-strong h-11 min-w-0 flex-1 rounded-full border border-[var(--field-border)] bg-[var(--field-bg)] px-4 text-sm outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--focus-ring)]" />
              <button type="submit" disabled={!input.trim()} aria-label="Send" className="grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-b from-gold-300 to-gold-500 text-[var(--text-onGold)] transition-opacity disabled:opacity-40"><ArrowUp className="size-5" /></button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
