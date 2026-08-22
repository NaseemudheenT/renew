"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, Sparkles, RotateCcw } from "lucide-react";
import { AnimatedModal, AnimatedButton } from "@/components/motion";
import { TransactionForm } from "./TransactionForm";
import { getSpeechRecognition, isVoiceSupported, parseSpokenTransaction } from "@/lib/voice";
import type { Transaction, TxType } from "@/lib/types";
import type { TransactionInput } from "@/lib/firestore/transactions";

/**
 * Speak a transaction — "spent five hundred on groceries" — and Renew drafts it
 * for you to confirm. Uses the device's own speech recognition; where that isn't
 * available (e.g. iOS Safari today) it says so honestly and you can type instead.
 */
export function VoiceAdd({
  open,
  onClose,
  onSubmit,
  submitting,
  currency,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: TransactionInput) => void;
  submitting: boolean;
  currency: string;
}) {
  const supported = isVoiceSupported();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [draft, setDraft] = useState<Transaction | null>(null);
  const recRef = useRef<ReturnType<typeof getSpeechRecognition>>(null);
  const finalRef = useRef("");

  function toDraft(text: string) {
    const p = parseSpokenTransaction(text);
    const now = Date.now();
    setDraft({
      id: "voice",
      type: p.type as TxType,
      amount: p.amount ?? 0,
      currency,
      category: p.category,
      note: p.note,
      date: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  function start() {
    const rec = getSpeechRecognition();
    if (!rec) return;
    finalRef.current = "";
    setTranscript("");
    setDraft(null);
    rec.lang = (typeof navigator !== "undefined" && navigator.language) || "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      let t = "";
      for (const r of Array.from(e.results)) t += r[0]?.transcript ?? "";
      finalRef.current = t;
      setTranscript(t);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => {
      setListening(false);
      if (finalRef.current.trim()) toDraft(finalRef.current);
    };
    recRef.current = rec;
    setListening(true);
    rec.start();
  }

  function stop() {
    recRef.current?.stop();
  }

  function reset() {
    stop();
    setListening(false);
    setTranscript("");
    setDraft(null);
    finalRef.current = "";
  }

  function close() {
    reset();
    onClose();
  }

  return (
    <AnimatedModal open={open} onClose={close} title={draft ? "Confirm" : "Add by voice"}>
      {!supported ? (
        <div className="flex flex-col items-center py-6 text-center">
          <div className="mb-4 grid size-14 place-items-center rounded-full bg-[var(--glass-bg-strong)]">
            <Mic className="size-6 text-[var(--text-muted)]" />
          </div>
          <p className="text-strong text-sm font-medium">Voice isn&apos;t available here</p>
          <p className="text-muted mt-1 max-w-xs text-sm">
            Your current browser doesn&apos;t support voice input. You can still add it in a tap.
          </p>
          <AnimatedButton className="mt-5" variant="glass" onClick={close}>Close</AnimatedButton>
        </div>
      ) : draft ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-2.5">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-[var(--color-gold-500)]" />
            <p className="text-body text-sm">“{transcript}” — check the details and add.</p>
          </div>
          <TransactionForm
            initial={draft}
            defaultCurrency={currency}
            submitting={submitting}
            onSubmit={onSubmit}
            onCancel={reset}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center py-6 text-center">
          <button
            type="button"
            onClick={listening ? stop : start}
            aria-label={listening ? "Stop" : "Start talking"}
            className="relative grid size-24 place-items-center rounded-full text-white"
            style={{ background: "linear-gradient(to bottom, var(--color-gold-400), var(--color-gold-600))" }}
          >
            {listening && (
              <motion.span
                className="absolute inset-0 rounded-full"
                style={{ background: "var(--color-gold-400)", opacity: 0.4 }}
                animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
              />
            )}
            <Mic className="size-9" />
          </button>
          <p className="text-strong mt-5 text-sm font-medium">
            {listening ? "Listening… tap to stop" : "Tap and speak"}
          </p>
          <p className="text-muted mt-1 max-w-xs text-sm">
            {transcript ? `“${transcript}”` : "Try: “spent five hundred on groceries” or “received 20000 salary”."}
          </p>
          {transcript && !listening && (
            <AnimatedButton className="mt-5" variant="glass" onClick={start}>
              <RotateCcw className="size-4" />Try again
            </AnimatedButton>
          )}
        </div>
      )}
    </AnimatedModal>
  );
}
