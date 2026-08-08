"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Atmosphere } from "@/components/atmosphere/live-atmosphere";
import { RenewMark } from "@/components/brand/renew-mark";
import { Wordmark } from "@/components/brand/wordmark";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { InstallButton } from "@/components/pwa/install";
import { sleep } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function Landing() {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  async function begin() {
    if (leaving) return;
    setLeaving(true);
    await sleep(720); // let the expand play before we navigate
    router.push("/login");
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6">
      <Atmosphere />

      {/* Quiet chrome — install affordance + theme toggle */}
      <div className="fixed top-5 right-5 z-20 flex items-center gap-2">
        <InstallButton />
        <ThemeToggle />
      </div>

      <AnimatePresence>
        {!leaving && (
          <motion.div
            key="hero"
            className="flex flex-col items-center text-center"
            exit={{ opacity: 0, filter: "blur(6px)", transition: { duration: 0.5 } }}
          >
            {/* The mark is the experience — tap it to begin */}
            <motion.button
              type="button"
              onClick={begin}
              aria-label="Enter Renew"
              className="group relative rounded-full p-6 outline-none"
              animate={leaving ? { scale: 8, opacity: 0 } : { scale: 1, opacity: 1 }}
              transition={{ duration: 0.72, ease: EASE }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Soft breathing halo */}
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, color-mix(in oklab, var(--gold) 22%, transparent), transparent 68%)",
                }}
                animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />
              <RenewMark size={132} animated />
            </motion.button>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.9, ease: EASE }}
              className="mt-8"
            >
              <Wordmark as="h1" className="text-4xl sm:text-5xl" />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.7, duration: 0.9, ease: EASE }}
              className="mt-5 max-w-xs text-[15px] leading-relaxed text-[var(--muted)] sm:max-w-sm"
            >
              Never lose money, documents, or peace of mind because you forgot something important.
            </motion.p>

            <motion.button
              type="button"
              onClick={begin}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.4, duration: 1, ease: EASE }}
              className="group mt-12 inline-flex items-center gap-3 text-xs tracking-[0.35em] text-[var(--subtle)] uppercase transition-colors hover:text-[var(--gold)]"
            >
              <span className="h-px w-8 bg-current opacity-40 transition-all group-hover:w-12" />
              Begin
              <span className="h-px w-8 bg-current opacity-40 transition-all group-hover:w-12" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Parent-company mark, whisper-quiet */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: leaving ? 0 : 1 }}
        transition={{ delay: 2.8, duration: 1 }}
        className="fixed bottom-6 text-[10px] tracking-[0.3em] text-[var(--subtle)] uppercase"
      >
        A Zap product
      </motion.p>
    </main>
  );
}
