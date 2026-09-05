"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

const LENGTH = 4;

/**
 * An Apple-style passcode pad: four slots and a numeric keypad. As you press a
 * digit it appears in its slot for a beat, then quietly becomes a filled marker
 * — the iOS reveal. Wrong entries shake and clear. Fixed at 4 digits. Shared by
 * the app-lock screen and setup so the feel is identical everywhere.
 *
 * Controlled: the parent owns `value` (0–4 digits). `onComplete` fires once four
 * digits are entered. Bump `shakeSignal` to play the shake-and-clear (the parent
 * clears `value` in the same update).
 */
export function PinPad({
  value,
  onChange,
  onComplete,
  shakeSignal = 0,
}: {
  value: string;
  onChange: (next: string) => void;
  onComplete?: (code: string) => void;
  shakeSignal?: number;
}) {
  const [reveal, setReveal] = useState(-1); // index currently showing its digit
  const shake = useAnimationControls();
  const revealTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => { if (revealTimer.current) clearTimeout(revealTimer.current); }, []);

  useEffect(() => {
    if (shakeSignal > 0) {
      void shake.start({ x: [0, -12, 10, -8, 6, -3, 0], transition: { duration: 0.42 } });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReveal(-1);
    }
  }, [shakeSignal, shake]);

  function press(d: string) {
    if (value.length >= LENGTH) return;
    const next = value + d;
    const idx = next.length - 1;
    setReveal(idx);
    if (revealTimer.current) clearTimeout(revealTimer.current);
    revealTimer.current = setTimeout(() => setReveal((r) => (r === idx ? -1 : r)), 550);
    onChange(next);
    if (next.length === LENGTH) onComplete?.(next);
  }
  function back() { onChange(value.slice(0, -1)); setReveal(-1); }

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"] as const;

  return (
    <div className="flex flex-col items-center">
      {/* Slots */}
      <motion.div animate={shake} className="flex items-center gap-4">
        {Array.from({ length: LENGTH }).map((_, i) => {
          const filled = i < value.length;
          const showing = reveal === i && filled;
          return (
            <span key={i} className="grid size-5 place-items-center">
              {showing ? (
                <motion.span key="d" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="text-strong text-lg font-medium tabular-nums">{value[i]}</motion.span>
              ) : (
                <span className={cn("rounded-full transition-all", filled ? "size-3.5 bg-[var(--color-gold-500)]" : "size-3 border border-[var(--text-muted)]/40")} />
              )}
            </span>
          );
        })}
      </motion.div>

      {/* Keypad */}
      <div className="mt-9 grid grid-cols-3 gap-3.5">
        {keys.map((k, i) => {
          if (k === "") return <span key={i} />;
          if (k === "back") return (
            <button key={i} type="button" onClick={back} aria-label="Delete"
              className="grid size-[4.25rem] place-items-center rounded-full text-[var(--text-body)] transition-colors active:bg-[var(--glass-bg-soft)] disabled:opacity-30"
              disabled={value.length === 0}>
              <Delete className="size-6" />
            </button>
          );
          return (
            <button key={i} type="button" onClick={() => press(k)} aria-label={k}
              className="grid size-[4.25rem] place-items-center rounded-full border border-[var(--field-border)] bg-[var(--field-bg)] text-2xl font-light text-[var(--text-strong)] transition-all active:scale-90 active:bg-[var(--glass-bg-strong)]">
              {k}
            </button>
          );
        })}
      </div>
    </div>
  );
}
