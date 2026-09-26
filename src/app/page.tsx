"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, useAnimationControls } from "framer-motion";
import { CinematicRenew } from "@/components/brand/CinematicRenew";

/**
 * RENEW — the entry, and the first impression. The mark arrives from depth with
 * a soft pop, a single signal-pulse ripples outward from it, a slow halo turns
 * behind, and the wordmark settles in. The emblem itself stays FIXED (no idle
 * drift) — touch it and it springs, then carries you into sign-in.
 * Reduced-motion safe.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

export default function Home() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const shake = useAnimationControls();
  const [entering, setEntering] = useState(false);

  function enter() {
    if (entering) return;
    setEntering(true);
    if (reduced) {
      router.push("/sign-up");
      return;
    }
    void shake.start({
      rotate: [0, -7, 6, -5, 4, -2, 1.5, 0],
      scale: [1, 1.1, 0.95, 1.06, 0.99, 1.02, 1],
      transition: { duration: 0.62, ease: [0.36, 0.07, 0.19, 0.97] },
    });
    window.setTimeout(() => router.push("/sign-up"), 560);
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6">
      {/* Ambient midnight glow behind the fixed emblem (glow only — never moves it). */}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[44%] size-[48vmax] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px]"
        style={{ background: "radial-gradient(circle, var(--bokeh-1), transparent 66%)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: reduced ? 0.5 : [0.34, 0.62, 0.34] }}
        transition={{ duration: reduced ? 0.8 : 7, repeat: reduced ? 0 : Infinity, ease: "easeInOut" }}
      />

      {/* Two light sweeps on entry — a cinematic wipe across the field. */}
      {!reduced && (
        <>
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ background: "linear-gradient(105deg, transparent 42%, rgba(210,228,255,0.12) 50%, transparent 58%)" }}
            initial={{ x: "-120%" }}
            animate={{ x: "120%" }}
            transition={{ delay: 0.5, duration: 1.6, ease: EASE }}
          />
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ background: "linear-gradient(105deg, transparent 46%, rgba(150,185,255,0.06) 50%, transparent 54%)" }}
            initial={{ x: "-120%" }}
            animate={{ x: "120%" }}
            transition={{ delay: 1.0, duration: 2.0, ease: EASE }}
          />
        </>
      )}

      {/* The cinematic light-formation of the RENEW logo — touch it to enter. */}
      <motion.button
        type="button"
        onClick={enter}
        aria-label="Enter Renew"
        className="group relative z-10 flex flex-col items-center rounded-3xl px-8 py-8 outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        whileTap={reduced ? undefined : { scale: 0.97 }}
      >
        <motion.span className="relative block transition-transform duration-500 ease-[var(--ease-glass)] group-hover:scale-[1.03]" animate={shake}>
          <CinematicRenew size={184} />
        </motion.span>
        <motion.span
          className="text-muted mt-8 text-xs tracking-widest uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: reduced ? 0.7 : [0, 0, 0.7] }}
          transition={{ duration: reduced ? 0.4 : 5, times: reduced ? undefined : [0, 0.85, 1], ease: "easeInOut" }}
        >
          Tap to enter
        </motion.span>
      </motion.button>

      {/* Privacy & Terms live in onboarding (where you accept them) and in
          Settings afterwards — kept off this first screen by design. */}
    </main>
  );
}
