"use client";

import { motion, useReducedMotion } from "framer-motion";
import { RenewMark } from "@/components/brand/RenewMark";
import { Wordmark } from "@/components/brand/Wordmark";

/**
 * The cinematic brand moment on every entry screen (sign-in / sign-up) — the
 * gold Renew mark and wordmark alone, with NO background tile, revealed with a
 * soft focus-in and a breathing golden glow behind it. It floats directly on the
 * screen's own background (dark night / light day) so it feels part of Renew,
 * not a pasted sticker. The boxed gold-on-black logo is reserved for the app
 * icon and favicon only. Stills under reduced-motion.
 */
export function AuthBrand() {
  const reduced = useReducedMotion();
  return (
    <div className="relative mb-8 flex flex-col items-center justify-center">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-6 size-64 rounded-full blur-[70px]"
        style={{ background: "radial-gradient(circle, rgba(212,175,110,0.32), transparent 66%)" }}
        initial={{ opacity: 0 }}
        animate={reduced ? { opacity: 0.5 } : { opacity: [0.4, 0.85, 0.5] }}
        transition={reduced ? { duration: 0.6 } : { duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="relative flex flex-col items-center"
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.92, filter: "blur(10px)" }}
        animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          style={{ filter: "drop-shadow(0 14px 44px rgba(212,175,110,0.4))" }}
          animate={reduced ? {} : { scale: [1, 1.03, 1] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <RenewMark size={92} idSuffix="auth" />
        </motion.div>
        <Wordmark sizeClassName="text-2xl" className="mt-3" />
      </motion.div>
    </div>
  );
}
