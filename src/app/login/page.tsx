"use client";

import { motion } from "framer-motion";
import { Atmosphere } from "@/components/atmosphere/atmosphere";
import { RenewMark } from "@/components/brand/renew-mark";
import { Wordmark } from "@/components/brand/wordmark";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Placeholder login surface — the full email / password / OTP experience is
 * built in Phase 2. This exists so the landing's "Begin" transition lands
 * somewhere real and on-brand.
 */
export default function LoginPage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-6">
      <Atmosphere />
      <div className="fixed top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="glass w-full max-w-sm rounded-[var(--radius-2xl)] p-10 text-center"
      >
        <div className="mb-6 flex justify-center">
          <RenewMark size={72} glow />
        </div>
        <Wordmark as="h1" className="text-2xl" />
        <p className="mt-4 text-sm text-[var(--muted)]">Welcome back. Sign-in arrives in Phase 2.</p>
      </motion.div>
    </main>
  );
}
