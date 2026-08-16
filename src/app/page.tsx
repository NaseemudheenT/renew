"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { RenewMark } from "@/components/brand/RenewMark";
import { Wordmark } from "@/components/brand/Wordmark";

/**
 * The Renew entry — a single, calm, cinematic first impression: the mark, the
 * wordmark, nothing else. Tapping the logo enters the login flow.
 */
export default function Home() {
  const reduced = useReducedMotion();

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <Link
        href="/sign-in"
        aria-label="Enter Renew"
        className="group flex flex-col items-center gap-7 rounded-3xl px-6 py-8 outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
      >
        {/* Mark — gently breathing to signal it's alive & tappable */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            animate={reduced ? undefined : { y: [0, -6, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
            className="transition-transform duration-500 ease-[var(--ease-calm)] group-hover:scale-105 group-active:scale-95"
          >
            <RenewMark
              size={148}
              className="drop-shadow-[0_10px_36px_rgba(150,110,45,0.28)]"
            />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <Wordmark sizeClassName="text-4xl sm:text-5xl" />
        </motion.div>
      </Link>
    </main>
  );
}
