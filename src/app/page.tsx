"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Atmosphere } from "@/components/atmosphere/live-atmosphere";
import { RenewMark } from "@/components/brand/renew-mark";
import { Wordmark } from "@/components/brand/wordmark";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { sleep } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function Landing() {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  async function enter() {
    if (leaving) return;
    setLeaving(true);
    await sleep(720); // let the expand play before we navigate
    router.push("/login");
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6">
      <Atmosphere />

      {/* Quiet chrome — theme toggle only */}
      <div className="fixed top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      <AnimatePresence>
        {!leaving && (
          <motion.div
            key="hero"
            className="flex flex-col items-center text-center"
            exit={{ opacity: 0, filter: "blur(6px)", transition: { duration: 0.5 } }}
          >
            {/* The logo is the experience — click it to enter */}
            <motion.button
              type="button"
              onClick={enter}
              aria-label="Enter Renew"
              className="group relative cursor-pointer rounded-full p-3 outline-none"
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
              <RenewMark size={128} animated />
            </motion.button>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.9, ease: EASE }}
              className="mt-2"
            >
              <Wordmark as="h1" className="text-4xl sm:text-5xl" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
