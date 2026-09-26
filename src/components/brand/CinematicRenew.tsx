"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * CINEMATIC RENEW — the logo engineered from light.
 *
 * The gold mark is physically DRAWN: a luminous point travels the ring and the
 * checkmark geometry (SVG pathLength), leaving a glowing trail until the emblem
 * is complete. The RENEW wordmark then forms letter-by-letter, left to right, as
 * if the same intelligent light flows into the word — each glyph igniting from a
 * blur into a clean, premium gold. A final energy pulse settles it.
 *
 * Deep-midnight, controlled cool→gold light, volumetric glow — the opening
 * identity of a future technology company. Fully stilled under reduced-motion
 * (the finished logo simply appears).
 */

const EASE = [0.22, 1, 0.36, 1] as const;
const LETTERS = ["R", "E", "N", "E", "W"] as const;

// When each phase begins, in seconds — one continuous, engineered timeline.
const T = { ring: 0.5, check: 1.7, word: 2.9, pulse: 4.0 } as const;

export function CinematicRenew({ size = 176 }: { size?: number }) {
  const reduced = useReducedMotion();

  // The drawing strokes: dim trail → bright as they complete.
  const draw = (delay: number, dur: number) =>
    reduced
      ? { initial: { pathLength: 1, opacity: 1 }, animate: { pathLength: 1, opacity: 1 } }
      : {
          initial: { pathLength: 0, opacity: 0.35 },
          animate: { pathLength: 1, opacity: 1 },
          transition: { pathLength: { delay, duration: dur, ease: EASE }, opacity: { delay, duration: dur * 0.5, ease: EASE } },
        };

  const ring = draw(T.ring, 1.4);
  const check = draw(T.check, 1.0);

  return (
    <div className="relative flex flex-col items-center">
      {/* Volumetric bloom that swells as the light works, then settles. */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[70px]"
        style={{ width: size * 1.9, height: size * 1.9, background: "radial-gradient(circle, rgba(212,175,110,0.34), rgba(96,132,240,0.14) 45%, transparent 70%)" }}
        initial={{ opacity: reduced ? 0.55 : 0 }}
        animate={reduced ? { opacity: 0.55 } : { opacity: [0, 0.5, 0.85, 0.6] }}
        transition={reduced ? { duration: 0.6 } : { duration: 4.2, times: [0, 0.4, 0.85, 1], ease: "easeInOut" }}
      />

      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" role="img" aria-label="Renew"
        className="relative" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="cr-gold" x1="20" y1="14" x2="82" y2="88">
            <stop offset="0" stopColor="#f7e7bd" />
            <stop offset="0.4" stopColor="#e4c88a" />
            <stop offset="0.75" stopColor="#c6a15b" />
            <stop offset="1" stopColor="#a5824a" />
          </linearGradient>
          {/* Volumetric glow around the luminous strokes — the "light" material. */}
          <filter id="cr-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="1.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g filter="url(#cr-glow)" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* The ring — a luminous point travels it into being. */}
          <motion.circle cx="50" cy="50" r="33" stroke="url(#cr-gold)" strokeWidth="6.6"
            transform="rotate(-90 50 50)" {...ring} />
          {/* The checkmark, cradled within — drawn as the light flows on. */}
          <motion.path d="M34 51 L45.5 62 L77 23" stroke="url(#cr-gold)" strokeWidth="7.4" {...check} />
        </g>
      </svg>

      {/* The wordmark forms letter-by-letter as the light flows into the word. */}
      <div className="relative mt-5 flex items-center" style={{ paddingLeft: "0.4em" }} aria-label="Renew">
        {LETTERS.map((ch, i) => (
          <motion.span
            key={i}
            className="font-brand font-light uppercase leading-none bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(180deg, var(--wordmark-from), var(--wordmark-to))",
              letterSpacing: "0.42em",
              fontSize: Math.round(size * 0.2),
            }}
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 6, filter: "blur(9px)" }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={reduced ? { duration: 0 } : { delay: T.word + i * 0.16, duration: 0.6, ease: EASE }}
          >
            {ch}
          </motion.span>
        ))}
        {/* A bright light bar sweeps across the word as it locks in. */}
        {!reduced && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-10"
            style={{ background: "linear-gradient(90deg, transparent, rgba(247,231,189,0.55), transparent)", filter: "blur(2px)" }}
            initial={{ left: "-15%", opacity: 0 }}
            animate={{ left: ["-15%", "110%"], opacity: [0, 0.9, 0] }}
            transition={{ delay: T.word + 0.2, duration: 0.9, ease: EASE }}
          />
        )}
      </div>

      {/* Final controlled energy pulse — the system confirms the lock-up. */}
      {!reduced && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute left-1/2 rounded-full"
          style={{ top: `${(size * 0.42) / 2}px`, width: size, height: size, translateX: "-50%", translateY: "-50%", border: "1.5px solid rgba(212,175,110,0.6)" }}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: [0.4, 1.9], opacity: [0, 0.55, 0] }}
          transition={{ delay: T.pulse, duration: 1.3, ease: "easeOut" }}
        />
      )}
    </div>
  );
}
