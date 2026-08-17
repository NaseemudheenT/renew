"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { RenewMark } from "@/components/brand/RenewMark";
import { Wordmark } from "@/components/brand/Wordmark";

/**
 * RENEW — the cinematic entry. The mark draws itself in and lifts toward the
 * viewer, the wordmark reveals beneath it, and tapping the logo enters the
 * product (→ login). Minimal, premium, unmistakably Renew.
 */
export default function Home() {
  const reduced = useReducedMotion();

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <Link
        href="/sign-in"
        aria-label="Enter Renew"
        className="group relative flex flex-col items-center gap-7 rounded-3xl px-8 py-10 outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
      >
        {/* Soft champagne halo behind the mark */}
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[34%] size-64 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[70px]"
          style={{ background: "radial-gradient(circle, var(--bokeh-1), transparent 68%)" }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: reduced ? 0.5 : [0.35, 0.6, 0.35], scale: 1 }}
          transition={{ duration: reduced ? 0.8 : 6, repeat: reduced ? 0 : Infinity, ease: "easeInOut" }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.82, y: 18, filter: "blur(6px)" }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            animate={reduced ? undefined : { y: [0, -6, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
            className="transition-transform duration-500 ease-[var(--ease-glass)] group-hover:scale-105 group-active:scale-95"
          >
            <RenewMark size={150} className="drop-shadow-[0_12px_40px_rgba(160,120,45,0.3)]" />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14, letterSpacing: "0.2em" }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <Wordmark sizeClassName="text-4xl sm:text-5xl" />
        </motion.div>

        <motion.span
          className="text-muted text-xs uppercase tracking-[0.32em]"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.7, 0.4] }}
          transition={{ delay: 1.4, duration: 2.4, repeat: reduced ? 0 : Infinity, repeatType: "reverse" }}
        >
          Tap to enter
        </motion.span>
      </Link>
    </main>
  );
}
