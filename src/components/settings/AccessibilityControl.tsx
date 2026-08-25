"use client";

import { useSyncExternalStore } from "react";
import { Switch } from "@/components/ui/Switch";
import {
  subscribeA11y, getTextSize, setTextSize, getContrast, setContrast,
  getReduceMotion, setReduceMotion, getBoldText, setBoldText,
  getUnderlineLinks, setUnderlineLinks, type TextSize,
} from "@/lib/a11y";
import { cn } from "@/lib/utils";

const SIZES: { value: TextSize; label: string }[] = [
  { value: "normal", label: "Default" },
  { value: "large", label: "Large" },
  { value: "larger", label: "Larger" },
];

/** Settings › Accessibility — text size, high contrast, reduce motion. */
export function AccessibilityControl() {
  const textSize = useSyncExternalStore(subscribeA11y, getTextSize, () => "normal" as TextSize);
  const contrast = useSyncExternalStore(subscribeA11y, getContrast, () => false);
  const reduceMotion = useSyncExternalStore(subscribeA11y, getReduceMotion, () => false);
  const boldText = useSyncExternalStore(subscribeA11y, getBoldText, () => false);
  const underlineLinks = useSyncExternalStore(subscribeA11y, getUnderlineLinks, () => false);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-body text-sm font-medium">Text size</p>
        <p className="text-muted mb-2 text-xs">Make everything easier to read.</p>
        <div className="inline-flex rounded-full border border-[var(--field-border)] bg-[var(--field-bg)] p-1 text-sm">
          {SIZES.map((s) => (
            <button key={s.value} type="button" onClick={() => setTextSize(s.value)} aria-pressed={textSize === s.value}
              className={cn("rounded-full px-4 py-1.5 transition-colors", textSize === s.value ? "bg-[var(--glass-bg-strong)] text-[var(--text-strong)]" : "text-[var(--text-muted)] hover:text-[var(--text-strong)]")}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-3">
        <span className="min-w-0">
          <span className="text-body block text-sm font-medium">High contrast</span>
          <span className="text-muted block text-xs">Stronger text and borders for easier reading.</span>
        </span>
        <Switch checked={contrast} onChange={setContrast} label="High contrast" />
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-3">
        <span className="min-w-0">
          <span className="text-body block text-sm font-medium">Reduce motion</span>
          <span className="text-muted block text-xs">Calms the moving background and animations.</span>
        </span>
        <Switch checked={reduceMotion} onChange={setReduceMotion} label="Reduce motion" />
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-3">
        <span className="min-w-0">
          <span className="text-body block text-sm font-medium">Bold text</span>
          <span className="text-muted block text-xs">Heavier text across Renew for easier reading.</span>
        </span>
        <Switch checked={boldText} onChange={setBoldText} label="Bold text" />
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-3">
        <span className="min-w-0">
          <span className="text-body block text-sm font-medium">Underline links</span>
          <span className="text-muted block text-xs">Adds an underline so links are easy to spot.</span>
        </span>
        <Switch checked={underlineLinks} onChange={setUnderlineLinks} label="Underline links" />
      </div>
    </div>
  );
}
