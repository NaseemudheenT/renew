"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * The cinematic brand moment on every entry screen (sign-in / sign-up) — the
 * founder's real gold Renew logo, revealed with a soft focus-in and a breathing
 * golden glow behind it. First thing everyone sees, on web and app. Stills under
 * reduced-motion.
 */
export function AuthBrand() {
  const reduced = useReducedMotion();
  return (
    <div className="relative mb-8 flex items-center justify-center">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute size-64 rounded-full blur-[70px]"
        style={{ background: "radial-gradient(circle, rgba(212,175,110,0.3), transparent 66%)" }}
        initial={{ opacity: 0 }}
        animate={reduced ? { opacity: 0.5 } : { opacity: [0.4, 0.85, 0.5] }}
        transition={reduced ? { duration: 0.6 } : { duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.img
        src="/renew-logo.png"
        alt="Renew"
        width={184}
        height={182}
        draggable={false}
        className="relative w-[184px] rounded-[1.6rem] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]"
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.92, filter: "blur(10px)" }}
        animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
