"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, useAnimationControls } from "framer-motion";
import { RenewMark } from "@/components/brand/RenewMark";
import { Wordmark } from "@/components/brand/Wordmark";

/**
 * RENEW — the entry. The mark + wordmark sit FIXED and centered over the live
 * midnight field (an ambient bloom + slow halo glow behind them — the logo
 * itself never drifts). Touch the logo and it springs with a rich animation,
 * then carries you into sign-in. Reduced-motion safe.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

export default function Home() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const shake = useAnimationControls();
  const [entering, setEntering] = useState(false);

  // Touch the logo → a rich spring animation, then into sign-in. Navigation runs
  // on a fixed timer (not awaiting the animation) so it can never be blocked.
  function enter() {
    if (entering) return;
    setEntering(true);
    if (reduced) {
      router.push("/sign-in");
      return;
    }
    void shake.start({
      rotate: [0, -7, 6, -5, 4, -2, 1.5, 0],
      scale: [1, 1.1, 0.95, 1.06, 0.99, 1.02, 1],
      transition: { duration: 0.62, ease: [0.36, 0.07, 0.19, 0.97] },
    });
    window.setTimeout(() => router.push("/sign-in"), 560);
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6">
      {/* Ambient midnight glow behind the fixed emblem (glow only — never moves it). */}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[44%] size-[48vmax] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px]"
        style={{ background: "radial-gradient(circle, var(--bokeh-1), transparent 66%)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: reduced ? 0.5 : [0.34, 0.6, 0.34] }}
        transition={{ duration: reduced ? 0.8 : 7, repeat: reduced ? 0 : Infinity, ease: "easeInOut" }}
      />

      {/* One-time light sweep on entry. */}
      {!reduced && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(105deg, transparent 42%, rgba(210,228,255,0.10) 50%, transparent 58%)" }}
          initial={{ x: "-120%" }}
          animate={{ x: "120%" }}
          transition={{ delay: 0.55, duration: 1.7, ease: EASE }}
        />
      )}

      {/* Fixed emblem — touch it to enter. */}
      <motion.button
        type="button"
        onClick={enter}
        aria-label="Enter Renew"
        className="group relative z-10 flex flex-col items-center rounded-3xl px-8 py-8 outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        initial={{ opacity: 0, scale: 0.6, filter: "blur(10px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 1.1, ease: EASE }}
        whileTap={reduced ? undefined : { scale: 0.96 }}
      >
        <span className="relative">
          {/* Pulsing bloom (glow only — behind the mark). */}
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 size-56 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[46px]"
            style={{ background: "radial-gradient(circle, var(--bokeh-3), transparent 62%)" }}
            animate={reduced ? undefined : { opacity: [0.4, 0.75, 0.4] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Slow-rotating halo ring (behind). */}
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg, transparent, var(--bokeh-1), transparent 38%, var(--bokeh-3), transparent 72%)",
              maskImage: "radial-gradient(closest-side, transparent 57%, #000 60%, #000 71%, transparent 74%)",
              WebkitMaskImage: "radial-gradient(closest-side, transparent 57%, #000 60%, #000 71%, transparent 74%)",
              opacity: 0.55,
            }}
            animate={reduced ? undefined : { rotate: 360 }}
            transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
          />
          {/* The mark — fixed; only the press animation moves it. */}
          <motion.span
            className="relative block transition-transform duration-500 ease-[var(--ease-glass)] group-hover:scale-[1.04]"
            animate={shake}
          >
            <RenewMark size={148} idSuffix="hero" className="drop-shadow-[0_16px_54px_rgba(70,110,220,0.42)]" />
          </motion.span>

          {/* Soft mirrored reflection beneath the mark. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-full mt-3 h-16 w-40 -translate-x-1/2 scale-y-[-1] opacity-25 blur-[3px] [mask-image:linear-gradient(to_bottom,#000,transparent_75%)]"
          >
            <RenewMark size={96} idSuffix="hero-reflection" className="mx-auto" />
          </span>
        </span>

        <motion.span
          className="mt-9"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.9, ease: EASE }}
        >
          <Wordmark sizeClassName="text-5xl sm:text-7xl" />
        </motion.span>
      </motion.button>

      {/* Privacy · Terms — quietly present on the entry. */}
      <motion.footer
        className="absolute inset-x-0 bottom-7 z-10 flex items-center justify-center gap-3 text-xs text-[var(--text-muted)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.9, ease: EASE }}
      >
        <Link href="/privacy" className="transition-colors hover:text-[var(--text-body)]">Privacy</Link>
        <span aria-hidden="true" className="opacity-50">·</span>
        <Link href="/terms" className="transition-colors hover:text-[var(--text-body)]">Terms</Link>
      </motion.footer>
    </main>
  );
}
