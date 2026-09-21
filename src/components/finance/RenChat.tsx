"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { Mic, ArrowUp, Volume2, VolumeX, Square } from "lucide-react";
import { RenLogo } from "@/components/brand/RenLogo";
import { RenChart, type RenChartData } from "@/components/finance/RenChart";
import { type AskContext } from "@/lib/ask";
import { useRenBrain } from "@/hooks/useRenBrain";
import { listen, speak, stopSpeaking, isVoiceSupported, speechOutputSupported, type Listener } from "@/lib/voice";
import { renVoiceSpeakOpts } from "@/lib/ren-voices";
import { monthRange } from "@/lib/finance";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useUserProfile } from "@/hooks/useUserProfile";
import { toast } from "@/components/ui/toast-store";
import { cn } from "@/lib/utils";

interface Msg { id: string; role: "user" | "ren"; text: string; amount?: number; currency?: string; chart?: RenChartData }

/** "Show me my spending / a breakdown / a chart" — a request Ren answers visually. */
function wantsChart(t: string): boolean {
  return /\b(show|see|display|chart|graph|visual|breakdown|pie|bar)\b/i.test(t) && /(spend|spent|expense|categor|money|budget|where)/i.test(t);
}

const CHIPS = ["Show my spending", "Spent 200 on lunch", "How much did I spend this month?", "How much can I spend?", "What's my net worth?"];
const EASE = [0.22, 1, 0.36, 1] as const;

let msgSeq = 0;
const nextId = () => `m${++msgSeq}`;

/**
 * Ren — Renew's finance assistant. Type or speak: record money ("spent 500 on
 * groceries") or ask about it ("how much did I spend?"), and hear the answer.
 * When the LLM brain is enabled (publicEnv.renLlm), it routes through the server
 * orchestrator (/api/ren) for full natural-language + authorized tool-calling;
 * otherwise it uses the on-device deterministic engine (no network, always
 * correct). A floating, premium panel with a living voice orb — Siri-calm, in
 * Renew's champagne style.
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
  const { profile } = useUserProfile();
  const { ask } = useRenBrain(ctx, uid);
  const dragControls = useDragControls();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  // Auto-speak follows the saved Ren preference (Settings › Ren); `muted` is a
  // per-session override from the in-chat speaker button.
  const [muted, setMuted] = useState(false);
  const speakOn = (profile?.renAutoSpeak ?? true) && !muted;
  const [thinking, setThinking] = useState(false);
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
  function say(text: string) { if (speakOn && voiceOut) speak(text, { ...renVoiceSpeakOpts(profile?.renVoiceURI), rate: profile?.renVoiceRate }); }

  function respond(text: string, extra?: { amount?: number; currency?: string }) {
    push({ role: "ren", text, ...extra });
    say(text);
  }

  /** Build this month's spending-by-category chart from the live data. */
  function spendingChart(): RenChartData | null {
    const { start, end } = monthRange();
    const m = new Map<string, number>();
    for (const t of ctx.transactions) {
      if (t.type === "expense" && t.date >= start && t.date < end) m.set(t.category, (m.get(t.category) ?? 0) + t.amount);
    }
    const rows = [...m.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount).slice(0, 6);
    return rows.length ? { title: "Your spending this month", currency: ctx.currency, rows } : null;
  }

  async function handle(raw: string) {
    const text = raw.trim();
    if (!text) return;
    const history = msgs.slice(-10).map((m) => ({ role: m.role, text: m.text }));
    push({ role: "user", text });
    setInput("");

    // A visual request — draw the chart from real data (the "Jarvis" moment).
    if (wantsChart(text)) {
      const chart = spendingChart();
      if (chart) {
        const total = chart.rows.reduce((s, r) => s + r.amount, 0);
        const line = `Here's your spending this month — ${money(total, ctx.currency)} across your top categories.`;
        push({ role: "ren", text: line, chart });
        say(line);
        return;
      }
      respond("You have no spending recorded this month yet — add a few and I'll chart it for you.");
      return;
    }

    setThinking(true);
    try {
      const res = await ask(text, history);
      respond(res.text, res.amount !== undefined ? { amount: res.amount, currency: res.currency } : undefined);
    } catch {
      respond("Something went wrong just now — please try again.");
    } finally {
      setThinking(false);
    }
  }

  function toggleMic() {
    if (listening) { listenerRef.current?.stop(); setListening(false); return; }
    stopSpeaking();
    const l = listen({
      onText: (t) => { setInput(t); void handle(t); },
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
            className="fixed inset-0 z-50 mx-auto flex h-dvh w-full flex-col overflow-hidden sm:inset-4 sm:mx-auto sm:h-auto sm:max-w-2xl sm:rounded-[2rem] lg:inset-y-6 lg:left-1/2 lg:w-[42rem] lg:-translate-x-1/2"
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_e, info) => { if (info.offset.y > 110 || info.velocity.y > 600) onClose(); }}
            style={{ background: "var(--glass-bg-strong)", boxShadow: "var(--glass-shadow), 0 40px 120px -20px rgba(0,0,0,0.6)", border: "1px solid var(--glass-border)", backdropFilter: "blur(28px) saturate(1.4)", paddingTop: "env(safe-area-inset-top,0px)" }}
          >
            {/* Ambient champagne glow */}
            <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(212,175,110,0.28),transparent_65%)] blur-2xl" />

            {/* Grab handle — swipe down to close (no X). */}
            <div
              className="mx-auto mt-2 h-1.5 w-10 shrink-0 cursor-grab touch-none rounded-full bg-[var(--text-muted)]/30"
              onPointerDown={(e) => dragControls.start(e)}
              aria-hidden="true"
            />

            {/* Header */}
            <div className="relative flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <RenLogo size={38} idSuffix="hdr" />
                <div>
                  <h2 className="text-strong text-base font-medium leading-tight">Ren</h2>
                  <p className="text-muted text-xs">{listening ? "Listening…" : "Your finance assistant"}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {voiceOut && (
                  <button type="button" onClick={() => setMuted((m) => { const next = !m; if (next) stopSpeaking(); return next; })} aria-pressed={speakOn} aria-label={speakOn ? "Turn voice off" : "Turn voice on"}
                    className="grid size-9 place-items-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--glass-bg-soft)] hover:text-[var(--text-strong)]">
                    {speakOn ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
                  </button>
                )}
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
                    <RenLogo size={64} idSuffix="hero" />
                    <div>
                      <p className="text-strong text-base font-medium">Hi, I&apos;m Ren.</p>
                      <p className="text-muted mx-auto mt-1 max-w-xs text-sm">Tell me what you spent, or ask anything about your money. It all stays on your device.</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="chat" className="space-y-3 py-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {msgs.map((m) => (
                      <motion.div key={m.id} initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.32, ease: EASE }}
                        className={cn("flex flex-col gap-2", m.role === "user" ? "items-end" : "items-start")}>
                        <div className={cn("max-w-[86%] rounded-3xl px-4 py-2.5 text-sm leading-relaxed",
                          m.role === "user"
                            ? "rounded-br-lg bg-gradient-to-br from-[var(--color-gold-300)] to-[var(--color-gold-500)] text-[var(--text-onGold)]"
                            : "rounded-bl-lg border border-[var(--glass-border)] bg-[var(--glass-bg-soft)] text-[var(--text-body)]")}>
                          {m.text}
                          {m.amount !== undefined && (
                            <span className={cn("mt-1 block text-2xl font-light tabular-nums", m.role === "user" ? "text-[var(--text-onGold)]" : "text-strong")}>{money(m.amount, m.currency ?? ctx.currency)}</span>
                          )}
                        </div>
                        {m.chart && <div className="w-[92%]"><RenChart data={m.chart} /></div>}
                      </motion.div>
                    ))}
                    {thinking && (
                      <div className="flex justify-start">
                        <div className="flex items-center gap-1.5 rounded-3xl rounded-bl-lg border border-[var(--glass-border)] bg-[var(--glass-bg-soft)] px-4 py-3">
                          {[0, 1, 2].map((i) => (
                            <motion.span key={i} className="size-1.5 rounded-full bg-[var(--color-gold-400)]"
                              animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                              transition={{ duration: 1, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }} />
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Chips before first message */}
            {msgs.length === 0 && !listening && (
              <div className="flex flex-wrap gap-2 px-5 pb-2">
                {CHIPS.map((c, i) => (
                  <motion.button key={c} type="button" onClick={() => void handle(c)}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i, ease: EASE }}
                    className="text-body rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg-soft)] px-3 py-1.5 text-xs font-medium transition-all hover:-translate-y-0.5 hover:border-[var(--focus-ring)]/50 hover:text-[var(--text-strong)]">{c}</motion.button>
                ))}
              </div>
            )}

            {/* Composer */}
            <form onSubmit={(e) => { e.preventDefault(); void handle(input); }} className="flex items-center gap-2 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3">
              {voiceIn && (
                <button type="button" onClick={toggleMic} aria-label={listening ? "Stop listening" : "Speak to Ren"} aria-pressed={listening}
                  className={cn("relative grid size-12 shrink-0 place-items-center rounded-full transition-all active:scale-95",
                    listening ? "bg-rose-500 text-white shadow-[0_0_24px_rgba(244,63,94,0.5)]" : "bg-[var(--glass-bg-soft)] text-[var(--color-gold-500)] hover:bg-[var(--glass-bg-strong)]")}>
                  {listening && <span className="absolute inset-0 animate-ping rounded-full bg-rose-500/40" />}
                  {listening ? <Square className="relative size-4" /> : <Mic className="relative size-5" />}
                </button>
              )}
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={listening ? "Listening…" : "Tell Ren, or ask…"} aria-label="Message Ren"
                className="rn-field text-strong h-12 min-w-0 flex-1 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg-soft)] px-5 text-sm outline-none placeholder:text-[var(--text-muted)]" />
              <button type="submit" disabled={!input.trim()} aria-label="Send" className="grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[var(--color-gold-300)] to-[var(--color-gold-500)] text-[var(--text-onGold)] shadow-[0_6px_20px_-6px_var(--color-gold-500)] transition-all hover:-translate-y-0.5 active:scale-95 disabled:translate-y-0 disabled:opacity-40"><ArrowUp className="size-5" /></button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
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
