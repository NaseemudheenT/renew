"use client";

import { useCallback, useEffect, useRef } from "react";
import { useInView, useReducedMotion, animate } from "framer-motion";
import { useLocale } from "@/components/providers/LocaleProvider";
import { usePrivacy } from "@/components/providers/PrivacyProvider";

/**
 * Counts up to a money value once, when scrolled into view — and, crucially,
 * shrinks to fit its container so a large amount never spills past its box on a
 * small phone. The full number is always shown (scaled from the left), down to a
 * sensible floor. This is why balances stay readable on every device.
 */
export function AnimatedAmount({
  value,
  currency,
  className,
  signed = false,
}: {
  value: number;
  currency: string;
  className?: string;
  signed?: boolean;
}) {
  const { money } = useLocale();
  const { hidden, mask } = usePrivacy();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduced = useReducedMotion();
  const prev = useRef<number>(0);

  // Scale the text down (from the left) whenever it's wider than the space it has.
  const fit = useCallback(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;
    el.style.transform = "scale(1)";
    const avail = parent.clientWidth;
    const w = el.scrollWidth;
    if (avail > 0 && w > avail) {
      el.style.transformOrigin = "left center";
      el.style.transform = `scale(${Math.max(0.45, avail / w)})`;
    }
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const render = (n: number) => {
      const sign = signed && n > 0 ? "+" : signed && n < 0 ? "−" : "";
      el.textContent = sign + money(Math.abs(n), currency);
      fit();
    };
    // Private by default — never paint a real amount while hidden.
    if (hidden) {
      el.textContent = mask;
      prev.current = 0;
      fit();
      return;
    }
    if (reduced || !inView) {
      render(value);
      prev.current = value;
      return;
    }
    const controls = animate(prev.current, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: render,
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, currency, inView, reduced, signed, money, hidden, mask, fit]);

  // Re-fit when the container resizes (rotation, split view, font scaling).
  useEffect(() => {
    const parent = ref.current?.parentElement;
    if (!parent || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => fit());
    ro.observe(parent);
    return () => ro.disconnect();
  }, [fit]);

  return (
    <span ref={ref} className={className} style={{ display: "inline-block", whiteSpace: "nowrap", maxWidth: "100%" }}>
      {hidden ? mask : money(Math.abs(value), currency)}
    </span>
  );
}
