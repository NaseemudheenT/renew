"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  Wallet, ArrowLeftRight, Target, PiggyBank, TrendingUp,
  ReceiptText, RefreshCw, Calendar, BarChart3, ArrowRight, ShieldCheck, Sparkles,
} from "lucide-react";
import { RenewMark } from "@/components/brand/RenewMark";
import { Wordmark } from "@/components/brand/Wordmark";
import { GlassButton } from "@/components/ui/liquid-glass";

/**
 * RENEW — the landing experience. A cinematic, Horizon-style entry rendered over
 * the live champagne WebGL background (global RenewBackground): the mark draws in
 * and lifts toward the viewer, the wordmark reveals, then scrolling brings the
 * value proposition and the finance modules forward in depth. Champagne-gold,
 * calm, premium — unmistakably Renew. Reduced-motion friendly.
 */

const ANSWERS = [
  "What money I have",
  "Where it's going",
  "What I owe",
  "What I've saved",
  "What I've invested",
  "What's coming next",
  "What needs attention",
] as const;

const MODULES = [
  { icon: Wallet, label: "Accounts" },
  { icon: ArrowLeftRight, label: "Transactions" },
  { icon: Target, label: "Budgets" },
  { icon: PiggyBank, label: "Savings" },
  { icon: TrendingUp, label: "Investments" },
  { icon: ReceiptText, label: "Bills" },
  { icon: RefreshCw, label: "Subscriptions" },
  { icon: Calendar, label: "Calendar" },
  { icon: BarChart3, label: "Analytics" },
] as const;

const EASE = [0.22, 1, 0.36, 1] as const;

export default function Home() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);

  // Scroll-driven depth: as the hero scrolls away, the mark comes toward the
  // viewer (scales up) and fades — a calm, cinematic parallax.
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const markScale = useTransform(scrollYProgress, [0, 1], [1, reduced ? 1 : 1.35]);
  const markY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -60]);
  const heroFade = useTransform(scrollYProgress, [0, 0.7], [1, reduced ? 1 : 0]);
  const glowY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 120]);
  const glow2Y = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -90]);

  function enter() {
    router.push("/sign-in");
  }

  return (
    <main className="relative">
      {/* ============================= HERO ============================= */}
      <section
        ref={heroRef}
        className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 text-center"
      >
        {/* Parallax champagne depth glows (separate from the global WebGL bg) */}
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[28%] size-[42vmax] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px]"
          style={{ background: "radial-gradient(circle, var(--bokeh-1), transparent 66%)", y: glowY }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: reduced ? 0.45 : [0.3, 0.55, 0.3], scale: 1 }}
          transition={{ duration: reduced ? 0.8 : 7, repeat: reduced ? 0 : Infinity, ease: "easeInOut" }}
        />
        {/* Deeper second glow, drifting the opposite way on scroll */}
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[16%] left-[38%] size-[30vmax] -translate-x-1/2 rounded-full blur-[100px]"
          style={{ background: "radial-gradient(circle, var(--bokeh-2), transparent 68%)", y: glow2Y }}
          initial={{ opacity: 0 }}
          animate={{ opacity: reduced ? 0.3 : [0.18, 0.4, 0.18] }}
          transition={{ duration: reduced ? 0.8 : 9, repeat: reduced ? 0 : Infinity, ease: "easeInOut" }}
        />

        <motion.div style={{ opacity: heroFade }} className="relative z-10 flex flex-col items-center">
          <motion.div style={{ scale: markScale, y: markY }} className="relative">
            {/* Slow-rotating champagne halo ring behind the mark */}
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
            <motion.div
              initial={{ opacity: 0, scale: 0.82, y: 18, filter: "blur(6px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1, ease: EASE }}
            >
              <motion.div
                animate={reduced ? undefined : { y: [0, -7, 0] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <RenewMark size={132} className="drop-shadow-[0_14px_46px_rgba(160,120,45,0.34)]" />
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div
            className="mt-7"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.9, ease: EASE }}
          >
            <Wordmark sizeClassName="text-4xl sm:text-6xl" />
          </motion.div>

          <motion.h1
            className="text-strong mt-6 max-w-xl text-2xl font-light leading-tight sm:text-3xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.9, ease: EASE }}
          >
            Your money, beautifully clear.
          </motion.h1>
          <motion.p
            className="text-muted mx-auto mt-3 max-w-md text-sm sm:text-base"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.9, ease: EASE }}
          >
            See what you have, where it&apos;s going, and what&apos;s coming next — in one
            calm, private place. Accounts, budgets, savings, investments, bills and more.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.9, ease: EASE }}
          >
            <GlassButton onClick={enter} aria-label="Get started with Renew">
              Get started <ArrowRight className="size-4" />
            </GlassButton>
            <GlassButton variant="neutral" onClick={enter} aria-label="Sign in to Renew">
              Sign in
            </GlassButton>
          </motion.div>

          <motion.p
            className="text-muted mt-5 inline-flex items-center gap-1.5 text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.75 }}
            transition={{ delay: 1.2, duration: 0.9 }}
          >
            <ShieldCheck className="size-3.5 text-emerald-500" />
            Private by design · your data stays yours
          </motion.p>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          aria-hidden="true"
          className="text-muted absolute bottom-7 left-1/2 -translate-x-1/2 text-[0.65rem] uppercase tracking-[0.32em]"
          initial={{ opacity: 0 }}
          animate={{ opacity: reduced ? 0.5 : [0, 0.7, 0.2] }}
          transition={{ delay: 1.6, duration: 2.4, repeat: reduced ? 0 : Infinity, repeatType: "reverse" }}
        >
          Scroll
        </motion.div>
      </section>

      {/* ===================== WHAT RENEW ANSWERS ===================== */}
      <section className="relative mx-auto max-w-4xl px-6 py-24">
        <motion.h2
          className="text-strong text-center text-xl font-light sm:text-2xl"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          Renew answers, instantly.
        </motion.h2>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {ANSWERS.map((a, i) => (
            <motion.div
              key={a}
              className="glass flex items-center gap-2.5 p-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.6, delay: reduced ? 0 : i * 0.05, ease: EASE }}
            >
              <Sparkles className="size-4 shrink-0 text-[var(--color-gold-500)]" />
              <span className="text-body text-sm">{a}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===================== MODULES ===================== */}
      <section className="relative mx-auto max-w-4xl px-6 pb-24">
        <motion.h2
          className="text-strong text-center text-xl font-light sm:text-2xl"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          One place for all of it.
        </motion.h2>
        <div className="mt-10 grid grid-cols-3 gap-3 sm:grid-cols-3 lg:grid-cols-3">
          {MODULES.map(({ icon: Icon, label }, i) => (
            <motion.div
              key={label}
              className="glass flex flex-col items-center gap-2 p-5 text-center"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              whileHover={reduced ? undefined : { y: -4, scale: 1.03 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.55, delay: reduced ? 0 : i * 0.04, ease: EASE }}
            >
              <span className="glass grid size-11 place-items-center !rounded-2xl">
                <Icon className="size-5 text-[var(--color-gold-500)]" />
              </span>
              <span className="text-body text-sm font-medium">{label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===================== FINAL CTA ===================== */}
      <section className="relative mx-auto max-w-3xl px-6 pb-28 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="glass glass-strong flex flex-col items-center gap-6 p-10 sm:p-14"
        >
          <RenewMark size={64} />
          <h2 className="text-strong text-2xl font-light sm:text-3xl">Start in seconds.</h2>
          <p className="text-muted max-w-sm text-sm">
            Sign in with Google and you&apos;re in. No spreadsheets, no clutter — just a
            clear picture of your money.
          </p>
          <GlassButton onClick={enter} aria-label="Get started with Renew">
            Get started <ArrowRight className="size-4" />
          </GlassButton>
        </motion.div>

        <footer className="text-muted mt-12 flex flex-col items-center gap-2 text-xs">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link href="/privacy" className="hover:text-[var(--text-strong)]">Privacy</Link>
            <Link href="/terms" className="hover:text-[var(--text-strong)]">Terms</Link>
            <a href="mailto:meetzapstudio@gmail.com" className="hover:text-[var(--text-strong)]">Contact</a>
          </div>
          <p className="opacity-70">Renew — by Zap</p>
        </footer>
      </section>
    </main>
  );
}
