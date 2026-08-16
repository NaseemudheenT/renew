"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEnvironmentTier } from "@/hooks/useEnvironmentTier";

/**
 * RENEW — the cinematic environment.
 *
 * Soft champagne light pools drifting through warm daylight (light) or warm fog
 * at night (dark), a faint film grain, and a gentle vignette. Pure CSS +
 * transform/opacity motion so it stays smooth everywhere and never distracts.
 * Fixed behind all content; ignores pointer events. Honours reduced motion and
 * the low-power ("soft2d") tier by going completely still.
 */
export function AtmosphericBackground() {
  const reduced = useReducedMotion();
  const tier = useEnvironmentTier();
  const still = reduced || tier === "soft2d";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Base tonal wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg, var(--bg-tint-1) 0%, var(--bg-tint-2) 55%, var(--bg-tint-3) 100%)",
        }}
      />

      {/* Drifting light pools (bokeh) */}
      <motion.div
        className="absolute -left-[10%] -top-[15%] h-[55vmax] w-[55vmax] rounded-full blur-[80px]"
        style={{ background: "radial-gradient(circle, var(--bokeh-1), transparent 65%)" }}
        animate={still ? undefined : { x: [0, 60, -20, 0], y: [0, 40, 10, 0] }}
        transition={{ duration: 34, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[-15%] top-[10%] h-[50vmax] w-[50vmax] rounded-full blur-[90px]"
        style={{ background: "radial-gradient(circle, var(--bokeh-2), transparent 65%)" }}
        animate={still ? undefined : { x: [0, -50, 20, 0], y: [0, 30, -20, 0] }}
        transition={{ duration: 42, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-20%] left-[20%] h-[48vmax] w-[48vmax] rounded-full blur-[90px]"
        style={{ background: "radial-gradient(circle, var(--bokeh-3), transparent 68%)" }}
        animate={still ? undefined : { x: [0, 40, -30, 0], y: [0, -30, 20, 0] }}
        transition={{ duration: 48, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Vignette for cinematic depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 120% at 50% 30%, transparent 55%, var(--vignette) 100%)",
        }}
      />

      {/* Fine film grain (SVG noise, no network) */}
      <div
        className="absolute inset-0 mix-blend-soft-light"
        style={{
          opacity: "var(--grain-opacity)",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "180px 180px",
        }}
      />
    </div>
  );
}
