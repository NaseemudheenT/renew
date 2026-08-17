"use client";

import { useEffect, useRef } from "react";
import { useInView, useReducedMotion, animate } from "framer-motion";
import { useLocale } from "@/components/providers/LocaleProvider";

/** Counts up to a money value once, when scrolled into view. */
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
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduced = useReducedMotion();
  const prev = useRef<number>(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const render = (n: number) => {
      const sign = signed && n > 0 ? "+" : signed && n < 0 ? "−" : "";
      el.textContent = sign + money(Math.abs(n), currency);
    };
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
  }, [value, currency, inView, reduced, signed, money]);

  return <span ref={ref} className={className}>{money(Math.abs(value), currency)}</span>;
}
