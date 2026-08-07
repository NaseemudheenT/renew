"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  error?: boolean;
  autoFocus?: boolean;
  onComplete?: (value: string) => void;
  disabled?: boolean;
}

/**
 * Six-box OTP input with paste support and keyboard navigation. Emits the full
 * string on change and fires onComplete when all digits are filled.
 */
export function OtpInput({
  value,
  onChange,
  length = 6,
  error,
  autoFocus,
  onComplete,
  disabled,
}: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  function setAt(index: number, char: string) {
    const next = digits.slice();
    next[index] = char;
    const joined = next.join("").slice(0, length);
    onChange(joined);
    if (joined.length === length && !joined.includes("")) onComplete?.(joined);
  }

  function handleChange(index: number, raw: string) {
    const clean = raw.replace(/\D/g, "");
    if (!clean) return;

    // Multiple digits at once (autofill, password manager, fast typing):
    // distribute them starting at this box.
    if (clean.length > 1) {
      const next = digits.slice();
      for (let i = 0; i < clean.length && index + i < length; i++) {
        next[index + i] = clean[i];
      }
      const joined = next.join("").slice(0, length);
      onChange(joined);
      const target = Math.min(index + clean.length, length - 1);
      refs.current[target]?.focus();
      if (joined.length === length && !joined.includes("")) onComplete?.(joined);
      return;
    }

    setAt(index, clean);
    if (index < length - 1) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[index]) {
        setAt(index, "");
      } else if (index > 0) {
        refs.current[index - 1]?.focus();
        setAt(index - 1, "");
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    if (pasted.length === length) onComplete?.(pasted);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  }

  return (
    <div className="flex justify-center gap-2 sm:gap-3" role="group" aria-label="Verification code">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={cn(
            "size-12 rounded-[var(--radius-md)] text-center text-xl font-semibold sm:size-14",
            "bg-[var(--surface)] text-[var(--foreground)] border transition-colors duration-200 outline-none",
            "focus:border-[var(--gold)] focus:ring-2 focus:ring-[color-mix(in_oklab,var(--gold)_25%,transparent)]",
            error ? "border-[var(--danger)]" : "border-[var(--border)]",
            disabled && "opacity-50",
          )}
        />
      ))}
    </div>
  );
}
