"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  motion,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useTransform,
  useAnimationControls,
} from "framer-motion";
import { RenewMark } from "@/components/brand/RenewMark";
import { Wordmark } from "@/components/brand/Wordmark";

/**
 * RENEW — the entry. One calm, cinematic view over the live midnight-blue field:
 * the mark arrives from depth, a slow halo turns and blooms behind it, the whole
 * emblem drifts with the cursor (parallax), and a single light sweeps across on
 * entry. Just the mark and the wordmark — tapping either enters (→ sign-in).
 * Reduced-motion safe.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

export default function Home() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const shake = useAnimationControls();
  const [entering, setEntering] = useState(false);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 55, damping: 18, mass: 0.6 });
  const sy = useSpring(py, { stiffness: 55, damping: 18, mass: 0.6 });
  const emblemX = useTransform(sx, [-0.5, 0.5], [-16, 16]);
  const emblemY = useTransform(sy, [-0.5, 0.5], [-14, 14]);
  const haloX = useTransform(sx, [-0.5, 0.5], [-28, 28]);
  const haloY = useTransform(sy, [-0.5, 0.5], [-24, 24]);

  function onMove(e: React.MouseEvent<HTMLElement>) {
    if (reduced) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  }

  // Tap the emblem: it springs to life — a quick, satisfying shake + bloom —
  // then we enter. The animation ONLY fires on the press, never idly.
  async function enter() {
    if (entering) return;
    setEntering(true);
    if (!reduced) {
      await shake.start({
        rotate: [0, -7, 6, -5, 4, -2, 1.5, 0],
        scale: [1, 1.09, 0.96, 1.05, 0.99, 1.02, 1],
        transition: { duration: 0.62, ease: [0.36, 0.07, 0.19, 0.97] },
      });
    }
    router.push("/sign-in");
  }

  return (
    <main
      onMouseMove={onMove}
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6"
    >
      {/* Midnight-blue aurora + a second opposite-drift glow (over the WebGL bg) */}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[42%] size-[48vmax] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px]"
        style={{ background: "radial-gradient(circle, var(--bokeh-1), transparent 66%)", x: haloX, y: haloY }}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: reduced ? 0.5 : [0.34, 0.62, 0.34], scale: 1 }}
        transition={{ duration: reduced ? 0.8 : 7, repeat: reduced ? 0 : Infinity, ease: "easeInOut" }}
      />
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[18%] left-[40%] size-[32vmax] -translate-x-1/2 rounded-full blur-[110px]"
        style={{ background: "radial-gradient(circle, var(--bokeh-2), transparent 68%)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: reduced ? 0.3 : [0.18, 0.42, 0.18] }}
        transition={{ duration: reduced ? 0.8 : 9, repeat: reduced ? 0 : Infinity, ease: "easeInOut" }}
      />

      {/* One-time light sweep on entry */}
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

      {/* Tapping the emblem enters sign-in. Arrives from depth, drifts with cursor. */}
      <motion.button
        type="button"
        onClick={enter}
        aria-label="Enter Renew"
        className="group relative z-10 flex flex-col items-center rounded-3xl px-8 py-8 outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        style={{ x: emblemX, y: emblemY }}
        initial={{ opacity: 0, scale: 0.55, filter: "blur(10px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 1.1, ease: EASE }}
        whileTap={reduced ? undefined : { scale: 0.96 }}
      >
        <span className="relative">
          {/* Pulsing bloom behind the mark */}
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 size-56 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[46px]"
            style={{ background: "radial-gradient(circle, var(--bokeh-3), transparent 62%)" }}
            animate={reduced ? undefined : { opacity: [0.4, 0.78, 0.4], scale: [0.92, 1.06, 0.92] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Slow-rotating halo ring */}
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg, transparent, var(--bokeh-1), transparent 38%, var(--bokeh-3), transparent 72%)",
              maskImage: "radial-gradient(closest-side, transparent 57%, #000 60%, #000 71%, transparent 74%)",
              WebkitMaskImage: "radial-gradient(closest-side, transparent 57%, #000 60%, #000 71%, transparent 74%)",
              opacity: 0.6,
            }}
            animate={reduced ? undefined : { rotate: 360 }}
            transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
          />
          {/* Gentle idle float (parent) + press-only shake (child controls). */}
          <motion.span
            className="relative block"
            animate={reduced ? undefined : { y: [0, -7, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.span
              className="relative block transition-transform duration-500 ease-[var(--ease-glass)] group-hover:scale-[1.05]"
              animate={shake}
            >
              <RenewMark size={148} idSuffix="hero" className="drop-shadow-[0_16px_54px_rgba(70,110,220,0.42)]" />
            </motion.span>
          </motion.span>

          {/* Premium touch: a soft mirrored reflection beneath the mark. */}
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

        {/* Quiet invitation — only cue that the emblem is the way in. */}
        <motion.span
          className="mt-6 text-[0.7rem] font-medium uppercase tracking-[0.32em] text-[var(--text-muted)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: reduced ? 0.7 : [0.35, 0.8, 0.35] }}
          transition={{ delay: 0.9, duration: reduced ? 0.6 : 3.4, repeat: reduced ? 0 : Infinity, ease: "easeInOut" }}
        >
          Tap to enter
        </motion.span>
      </motion.button>

      {/* Privacy · Terms — quietly present on the entry, as asked. */}
      <motion.footer
        className="absolute inset-x-0 bottom-7 z-10 flex items-center justify-center gap-3 text-xs text-[var(--text-muted)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.9, ease: EASE }}
      >
        <Link href="/privacy" className="transition-colors hover:text-[var(--text-body)]">
          Privacy
        </Link>
        <span aria-hidden="true" className="opacity-50">·</span>
        <Link href="/terms" className="transition-colors hover:text-[var(--text-body)]">
          Terms
        </Link>
      </motion.footer>
    </main>
  );
}
