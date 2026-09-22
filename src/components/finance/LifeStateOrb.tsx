"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { LifeState } from "@/lib/life-state";

/**
 * The dashboard "Life State" orb — a luminous sphere whose colour is the honest
 * read of the person's finances (see computeLifeState). A soft halo breathes and
 * a light ring slowly orbits, so a still screen still feels alive; both are
 * stilled under reduced-motion. Pure CSS/SVG, no libraries, no fabricated data.
 */
export function LifeStateOrb({ state, size = 150 }: { state: LifeState; size?: number }) {
  const reduced = useReducedMotion();
  const t = state.tone;
  const ball = Math.round(size * 0.62);

  return (
    <div
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Life state: ${state.label}`}
    >
      {/* Outer bloom — the ambient glow the orb casts. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute rounded-full"
        style={{
          inset: "-26%",
          background: `radial-gradient(circle, color-mix(in srgb, ${t} 42%, transparent), transparent 66%)`,
          filter: "blur(16px)",
        }}
        animate={reduced ? { opacity: 0.6 } : { opacity: [0.42, 0.8, 0.42], scale: [1, 1.06, 1] }}
        transition={reduced ? { duration: 0.4 } : { duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* A light ring that slowly orbits the sphere. */}
      {!reduced && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(from 0deg, transparent, color-mix(in srgb, ${t} 75%, transparent) 22%, transparent 46%)`,
            WebkitMask: "radial-gradient(circle, transparent 57%, #000 60%)",
            mask: "radial-gradient(circle, transparent 57%, #000 60%)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* The glossy sphere. */}
      <motion.div
        className="relative rounded-full"
        style={{
          width: ball,
          height: ball,
          background: `radial-gradient(circle at 34% 27%, color-mix(in srgb, ${t} 88%, #ffffff 12%), color-mix(in srgb, ${t} 55%, #05070a) 60%, color-mix(in srgb, ${t} 20%, #05070a) 100%)`,
          boxShadow: `inset 0 2px 7px color-mix(in srgb, #ffffff 42%, transparent), inset 0 -12px 22px color-mix(in srgb, #000000 55%, transparent), 0 0 44px -6px ${t}`,
        }}
        animate={reduced ? {} : { scale: [1, 1.025, 1] }}
        transition={reduced ? {} : { duration: 4.4, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Specular highlight — the light on the polished surface. */}
        <span
          aria-hidden
          className="absolute rounded-full"
          style={{
            top: "13%",
            left: "19%",
            width: "36%",
            height: "27%",
            background: "radial-gradient(circle, rgba(255,255,255,0.9), transparent 70%)",
            filter: "blur(2px)",
          }}
        />
      </motion.div>
    </div>
  );
}
