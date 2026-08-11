"use client";

import {
  useCallback,
  useMemo,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/utils";

export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
}

/**
 * Accessible 6-digit code input. Handles single digits, full-code paste, and
 * SMS/browser autofill (a whole code delivered to one box is distributed).
 */
export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  error = false,
  autoFocus = false,
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const digits = useMemo(() => {
    const arr = value.split("").slice(0, length);
    while (arr.length < length) arr.push("");
    return arr;
  }, [value, length]);

  const commit = useCallback(
    (next: string) => {
      const clean = next.replace(/\D/g, "").slice(0, length);
      onChange(clean);
      if (clean.length === length) onComplete?.(clean);
    },
    [length, onChange, onComplete],
  );

  const focusBox = useCallback((index: number) => {
    const el = refs.current[Math.max(0, Math.min(index, refs.current.length - 1))];
    el?.focus();
    el?.select();
  }, []);

  const handleInput = useCallback(
    (index: number, raw: string) => {
      const chars = raw.replace(/\D/g, "");
      if (!chars) return;

      // Autofill / multi-char: distribute across boxes from this index.
      if (chars.length > 1) {
        const arr = value.split("");
        for (let i = 0; i < chars.length && index + i < length; i++) {
          arr[index + i] = chars[i]!;
        }
        const joined = arr.join("").slice(0, length);
        commit(joined);
        focusBox(Math.min(index + chars.length, length - 1));
        return;
      }

      const arr = digits.slice();
      arr[index] = chars;
      commit(arr.join(""));
      if (index < length - 1) focusBox(index + 1);
    },
    [value, digits, length, commit, focusBox],
  );

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        e.preventDefault();
        const arr = digits.slice();
        if (arr[index]) {
          arr[index] = "";
          commit(arr.join(""));
        } else if (index > 0) {
          arr[index - 1] = "";
          commit(arr.join(""));
          focusBox(index - 1);
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault();
        focusBox(index - 1);
      } else if (e.key === "ArrowRight" && index < length - 1) {
        e.preventDefault();
        focusBox(index + 1);
      }
    },
    [digits, length, commit, focusBox],
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text");
      commit(text);
      const filled = text.replace(/\D/g, "").length;
      focusBox(Math.min(filled, length - 1));
    },
    [commit, focusBox, length],
  );

  return (
    <div
      className="flex items-center justify-center gap-2 sm:gap-3"
      role="group"
      aria-label={`${length}-digit verification code`}
    >
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={length}
          value={digit}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => handleInput(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={cn(
            "size-12 sm:size-14 rounded-2xl border bg-[var(--field-bg)] text-center",
            "text-xl font-semibold text-[var(--text-strong)] backdrop-blur-md",
            "transition-all duration-200 ease-[var(--ease-calm)]",
            "border-[var(--field-border)] focus:border-[var(--focus-ring)]",
            "focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)]/25",
            digit && "border-[var(--focus-ring)]/60",
            error && "border-rose-400/70",
          )}
        />
      ))}
    </div>
  );
}
