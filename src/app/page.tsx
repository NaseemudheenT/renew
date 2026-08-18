"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { RenewMark } from "@/components/brand/RenewMark";
import { Wordmark } from "@/components/brand/Wordmark";
import { GlassButton } from "@/components/ui/liquid-glass";

/**
 * RENEW — the landing. A single, calm, cinematic view over the live champagne
 * WebGL background: the mark draws in and breathes, a slow gold halo turns
 * behind it, and two liquid-glass actions enter the product. Deliberately
 * minimal, professional copy. Pressing the mark goes to sign-in.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

export default function Home() {
  const router = useRouter();
  const reduced = useReducedMotion();

  function enter() {
    router.push("/sign-in");
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 text-center">
      {/* Cinematic depth glows over the global WebGL background */}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[36%] size-[46vmax] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px]"
        style={{ background: "radial-gradient(circle, var(--bokeh-1), transparent 66%)" }}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: reduced ? 0.45 : [0.3, 0.55, 0.3], scale: 1 }}
        transition={{ duration: reduced ? 0.8 : 7, repeat: reduced ? 0 : Infinity, ease: "easeInOut" }}
      />
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[18%] left-[40%] size-[30vmax] -translate-x-1/2 rounded-full blur-[100px]"
        style={{ background: "radial-gradient(circle, var(--bokeh-2), transparent 68%)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: reduced ? 0.28 : [0.16, 0.36, 0.16] }}
        transition={{ duration: reduced ? 0.8 : 9, repeat: reduced ? 0 : Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 flex flex-col items-center">
        {/* Pressing the mark enters sign-in. */}
        <motion.button
          type="button"
          onClick={enter}
          aria-label="Enter Renew"
          className="group relative rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          initial={{ opacity: 0, scale: 0.82, y: 16, filter: "blur(6px)" }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1, ease: EASE }}
          whileTap={reduced ? undefined : { scale: 0.95 }}
        >
          {/* Slow-rotating champagne halo behind the mark */}
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
            transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          />
          <motion.span
            className="relative block transition-transform duration-500 ease-[var(--ease-glass)] group-hover:scale-[1.04]"
            animate={reduced ? undefined : { y: [0, -7, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <RenewMark size={132} className="drop-shadow-[0_14px_46px_rgba(160,120,45,0.34)]" />
          </motion.span>
        </motion.button>

        <motion.div
          className="mt-7"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.9, ease: EASE }}
        >
          <Wordmark sizeClassName="text-4xl sm:text-6xl" />
        </motion.div>

        <motion.p
          className="text-body mt-5 text-base font-light sm:text-lg"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.9, ease: EASE }}
        >
          Your money, beautifully clear.
        </motion.p>

        <motion.div
          className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.9, ease: EASE }}
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
