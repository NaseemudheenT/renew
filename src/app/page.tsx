"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { RenewMark } from "@/components/brand/RenewMark";
import { Wordmark } from "@/components/brand/Wordmark";
import { Sparkles, Mic, ScanLine, ShieldCheck, ArrowRight, ArrowDown, type LucideIcon } from "lucide-react";

/**
 * RENEW — the landing page and first impression. Keeps the signature glowing
 * emblem, then opens into a calm, premium story: what Renew is, what Ren does,
 * and how private it is — with clear ways in. Champagne-on-midnight, reduced-
 * motion safe. The animated fog lives globally in <RenewBackground/>.
 */

const EASE = [0.22, 1, 0.36, 1] as const;
const POP = [0.34, 1.4, 0.64, 1] as const;

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Mic, title: "Ren, your assistant", body: "Just say “spent 500 on groceries” — by voice or text. Ren records it, and answers anything about your money." },
  { icon: Sparkles, title: "Honest suggestions", body: "Real, correct guidance from your own numbers — what’s safe to spend, where to save. Never guessed, never sold." },
  { icon: ScanLine, title: "Scan any bill", body: "Snap a receipt and Renew reads the total for you. Import a bank statement too — it sorts itself out." },
  { icon: ShieldCheck, title: "Private by design", body: "Sign in with a passkey — no passwords. Your data is encrypted and yours alone. Nothing is ever sold." },
];

export default function Home() {
  const reduced = useReducedMotion();

  return (
    <main className="relative">
      {/* ---- HERO ---- */}
      <section className="relative flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <motion.span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[38%] size-[48vmax] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px]"
          style={{ background: "radial-gradient(circle, var(--bokeh-1), transparent 66%)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: reduced ? 0.5 : [0.32, 0.58, 0.32] }}
          transition={{ duration: reduced ? 0.8 : 7, repeat: reduced ? 0 : Infinity, ease: "easeInOut" }}
        />

        {/* Emblem */}
        <motion.span
          className="relative z-10"
          initial={{ opacity: 0, scale: 0.6, filter: "blur(12px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 1, ease: EASE, scale: { duration: 0.95, ease: POP } }}
        >
          <span className="relative block">
            <motion.span
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 size-52 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[46px]"
              style={{ background: "radial-gradient(circle, var(--bokeh-3), transparent 62%)" }}
              animate={reduced ? undefined : { opacity: [0.4, 0.75, 0.4] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.span
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 size-60 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background: "conic-gradient(from 0deg, transparent, var(--bokeh-1), transparent 38%, var(--bokeh-3), transparent 72%)",
                maskImage: "radial-gradient(closest-side, transparent 57%, #000 60%, #000 71%, transparent 74%)",
                WebkitMaskImage: "radial-gradient(closest-side, transparent 57%, #000 60%, #000 71%, transparent 74%)",
              }}
              initial={{ opacity: 0 }}
              animate={reduced ? { opacity: 0.5 } : { rotate: 360, opacity: 0.5 }}
              transition={{ rotate: { duration: 26, repeat: Infinity, ease: "linear" }, opacity: { duration: 1.4, delay: 0.4, ease: EASE } }}
            />
            <RenewMark size={128} idSuffix="hero" className="relative drop-shadow-[0_18px_60px_rgba(70,110,220,0.45)]" />
          </span>
        </motion.span>

        <motion.div
          className="relative z-10 mt-8 flex flex-col items-center"
          initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.45, duration: 0.9, ease: EASE }}
        >
          <Wordmark sizeClassName="text-2xl sm:text-3xl" />
          <h1 className="text-strong mt-6 max-w-2xl text-4xl font-light leading-[1.1] tracking-tight sm:text-6xl">
            Your money, clear<br className="hidden sm:block" /> and effortless.
          </h1>
          <p className="text-muted mt-5 max-w-xl text-base leading-relaxed sm:text-lg">
            See what you have, where it’s going, and what’s coming next — with <span className="text-body">Ren</span>, your private finance assistant.
          </p>

          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
            <Link href="/sign-up" className="group inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-br from-[var(--color-gold-300)] to-[var(--color-gold-500)] px-7 py-3.5 text-[0.95rem] font-medium text-[var(--text-onGold)] shadow-[0_10px_30px_-8px_var(--color-gold-500)] transition-all hover:-translate-y-0.5 active:scale-[0.98]">
              Get started free
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href="/sign-in" className="glass inline-flex h-12 items-center gap-2 rounded-full px-7 py-3.5 text-[0.95rem] font-medium text-[var(--text-body)] transition-all hover:-translate-y-0.5 hover:text-[var(--text-strong)]">
              Sign in
            </Link>
          </div>
          <p className="text-muted mt-6 inline-flex items-center gap-1.5 text-xs">
            <ShieldCheck className="size-3.5 text-[var(--color-gold-500)]" />
            No passwords · Face ID sign-in · Private by design
          </p>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          aria-hidden
          className="text-muted absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }} animate={{ opacity: reduced ? 0.6 : [0.3, 0.8, 0.3], y: reduced ? 0 : [0, 6, 0] }}
          transition={{ delay: 1, duration: reduced ? 0.6 : 2.4, repeat: reduced ? 0 : Infinity, ease: "easeInOut" }}
        >
          <ArrowDown className="size-5" />
        </motion.div>
      </section>

      {/* ---- FEATURES ---- */}
      <section className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
        <Reveal>
          <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-gold-500)]">Everything, in one calm place</p>
          <h2 className="text-strong mx-auto mt-3 max-w-2xl text-center text-3xl font-light tracking-tight sm:text-4xl">
            Powerful where it counts. Simple everywhere else.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.08}>
              <div className="glass h-full p-6 sm:p-7">
                <span className="grid size-11 place-items-center rounded-2xl bg-[var(--glass-bg-strong)]">
                  <f.icon className="size-5 text-[var(--color-gold-500)]" />
                </span>
                <h3 className="text-strong mt-4 text-lg font-medium">{f.title}</h3>
                <p className="text-muted mt-2 text-sm leading-relaxed">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---- CLOSING CTA ---- */}
      <section className="px-6 pb-24">
        <Reveal>
          <div className="glass glass-strong relative mx-auto max-w-3xl overflow-hidden p-10 text-center sm:p-14">
            <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-52 rounded-full bg-[radial-gradient(circle,var(--bokeh-3),transparent_70%)] blur-2xl opacity-70" />
            <h2 className="text-strong relative text-3xl font-light tracking-tight sm:text-4xl">Feel calm about money.</h2>
            <p className="text-muted relative mx-auto mt-3 max-w-md text-base">Set up in a minute. Free to start. Your data stays yours.</p>
            <Link href="/sign-up" className="group relative mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-br from-[var(--color-gold-300)] to-[var(--color-gold-500)] px-8 py-3.5 text-[0.95rem] font-medium text-[var(--text-onGold)] shadow-[0_10px_30px_-8px_var(--color-gold-500)] transition-all hover:-translate-y-0.5 active:scale-[0.98]">
              Get started free
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ---- FOOTER ---- */}
      <footer className="border-t border-[var(--glass-border)] px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <RenewMark size={22} idSuffix="footer" />
            <Wordmark sizeClassName="text-sm" />
          </div>
          <div className="text-muted flex items-center gap-5 text-xs">
            <Link href="/privacy" className="hover:text-[var(--text-strong)]">Privacy</Link>
            <Link href="/terms" className="hover:text-[var(--text-strong)]">Terms</Link>
            <span>© {new Date().getFullYear()} Renew</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

/** Fade-and-rise on scroll into view — the calm entrance shared down the page. */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}
