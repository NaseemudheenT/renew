"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowRight } from "lucide-react";
import { RenewMark } from "@/components/brand/RenewMark";
import { Wordmark } from "@/components/brand/Wordmark";
import { GlassButton } from "@/components/ui/liquid-glass";

/**
 * RENEW — the landing. One calm, cinematic view over the live champagne WebGL
 * field: the mark arrives from depth, a slow gold halo turns and blooms behind
 * it, the mark drifts with the cursor (parallax), and a single champagne light
 * sweeps across on entry. Two liquid-glass actions enter the product. Minimal,
 * professional copy. Pressing the mark goes to sign-in. Reduced-motion safe.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

export default function Home() {
  const router = useRouter();
  const reduced = useReducedMotion();

  // Pointer parallax — the mark and its halo drift with the cursor for depth.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 55, damping: 18, mass: 0.6 });
  const sy = useSpring(py, { stiffness: 55, damping: 18, mass: 0.6 });
  const markX = useTransform(sx, [-0.5, 0.5], [-14, 14]);
  const markY = useTransform(sy, [-0.5, 0.5], [-12, 12]);
  const haloX = useTransform(sx, [-0.5, 0.5], [-26, 26]);
  const haloY = useTransform(sy, [-0.5, 0.5], [-22, 22]);

  function onMove(e: React.MouseEvent<HTMLElement>) {
    if (reduced) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  }

  function enter() {
    router.push("/sign-in");
  }

  return (
    <main
      onMouseMove={onMove}
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 text-center"
    >
      {/* Deep champagne aurora + a second opposite-drift glow (over the WebGL bg) */}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[36%] size-[48vmax] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px]"
        style={{ background: "radial-gradient(circle, var(--bokeh-1), transparent 66%)", x: haloX, y: haloY }}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: reduced ? 0.5 : [0.34, 0.6, 0.34], scale: 1 }}
        transition={{ duration: reduced ? 0.8 : 7, repeat: reduced ? 0 : Infinity, ease: "easeInOut" }}
      />
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[16%] left-[40%] size-[32vmax] -translate-x-1/2 rounded-full blur-[110px]"
        style={{ background: "radial-gradient(circle, var(--bokeh-2), transparent 68%)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: reduced ? 0.28 : [0.16, 0.4, 0.16] }}
        transition={{ duration: reduced ? 0.8 : 9, repeat: reduced ? 0 : Infinity, ease: "easeInOut" }}
      />

      {/* One-time champagne light sweep on entry */}
      {!reduced && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(105deg, transparent 42%, rgba(255,244,214,0.10) 50%, transparent 58%)" }}
          initial={{ x: "-120%" }}
          animate={{ x: "120%" }}
          transition={{ delay: 0.55, duration: 1.7, ease: EASE }}
        />
      )}

      <div className="relative z-10 flex flex-col items-center">
        {/* Pressing the mark enters sign-in. Arrives from depth, drifts with cursor. */}
        <motion.button
          type="button"
          onClick={enter}
          aria-label="Enter Renew"
          className="group relative rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          style={{ x: markX, y: markY }}
          initial={{ opacity: 0, scale: 0.55, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.1, ease: EASE }}
          whileTap={reduced ? undefined : { scale: 0.95 }}
        >
          {/* Pulsing champagne bloom directly behind the mark */}
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 size-56 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[46px]"
            style={{ background: "radial-gradient(circle, var(--bokeh-3), transparent 62%)" }}
            animate={reduced ? undefined : { opacity: [0.4, 0.75, 0.4], scale: [0.92, 1.06, 0.92] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Slow-rotating champagne halo ring */}
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
          <motion.span
            className="relative block transition-transform duration-500 ease-[var(--ease-glass)] group-hover:scale-[1.05]"
            animate={reduced ? undefined : { y: [0, -7, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <RenewMark size={136} className="drop-shadow-[0_16px_50px_rgba(160,120,45,0.38)]" />
          </motion.span>
        </motion.button>

        <motion.div
          className="mt-7"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.9, ease: EASE }}
        >
          <Wordmark sizeClassName="text-4xl sm:text-6xl" />
        </motion.div>

        <motion.p
          className="text-body mt-5 text-base font-light sm:text-lg"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.9, ease: EASE }}
        >
          Your money, beautifully clear.
        </motion.p>

        <motion.div
          className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.9, ease: EASE }}
        >
          <GlassButton onClick={enter} aria-label="Get started with Renew">
            Get started <ArrowRight className="size-4" />
          </GlassButton>
          <GlassButton variant="neutral" onClick={enter} aria-label="Sign in to Renew">
            Sign in
          </GlassButton>
        </motion.div>
      </div>

      <motion.footer
        className="text-muted absolute bottom-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.75 }}
        transition={{ delay: 1.1, duration: 0.9 }}
      >
        <Link href="/privacy" className="hover:text-[var(--text-strong)]">Privacy</Link>
        <Link href="/terms" className="hover:text-[var(--text-strong)]">Terms</Link>
        <a href="mailto:meetzapstudio@gmail.com" className="hover:text-[var(--text-strong)]">Contact</a>
        <span className="opacity-70">Renew · by Zap</span>
      </motion.footer>
    </main>
  );
}
