"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";

/**
 * RENEW — the app ground. Professional midnight blue wrapped in a soft golden
 * fog: large, feathered gold glows over deep navy with a cool spatial aurora, a
 * vignette and faint grain. The depth layers drift gently with the pointer
 * (subtle parallax, different magnitudes = real depth) so the world feels alive
 * and three-dimensional without any idle motion. Pointer-only and reduced-motion
 * safe — touch devices and reduced-motion get the calm static ground.
 *
 * Fixed behind everything, never intercepts pointers. Theme-aware via tokens.
 */
export function RenewBackground() {
  const reduced = useReducedMotion();
  // Parallax switches on only AFTER mount (and only on fine-pointer, motion-OK
  // devices). Until then the render is plain static divs — identical on the
  // server and the first client render, so it never causes a hydration mismatch.
  const [on, setOn] = useState(false);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 18 });
  const sy = useSpring(my, { stiffness: 40, damping: 18 });

  // Three depth planes — the further "back", the less it moves.
  const aurora = { x: useTransform(sx, [-0.5, 0.5], [8, -8]), y: useTransform(sy, [-0.5, 0.5], [6, -6]) };
  const near = { x: useTransform(sx, [-0.5, 0.5], [-22, 22]), y: useTransform(sy, [-0.5, 0.5], [-16, 16]) };
  const far = { x: useTransform(sx, [-0.5, 0.5], [14, -14]), y: useTransform(sy, [-0.5, 0.5], [10, -10]) };

  useEffect(() => {
    if (reduced) return;
    if (typeof window === "undefined" || !window.matchMedia?.("(hover: hover) and (pointer: fine)").matches) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOn(true);
    const onMove = (e: PointerEvent) => {
      mx.set(e.clientX / window.innerWidth - 0.5);
      my.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduced, mx, my]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      {/* A gentle top-to-bottom deepening across the midnight ground. */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(165deg, var(--bg-tint-1) 0%, var(--bg-tint-2) 55%, var(--bg-tint-3) 100%)" }}
      />

      {/* A cool spatial aurora high in the frame — the deep-space horizon. */}
      <motion.div className="absolute inset-[-6%]" style={on ? { x: aurora.x, y: aurora.y, background: "radial-gradient(120% 55% at 50% -18%, var(--aurora), transparent 62%)" } : { background: "radial-gradient(120% 55% at 50% -18%, var(--aurora), transparent 62%)" }} />

      {/* Soft, static golden fog — three large feathered glows, gently parallaxed. */}
      <motion.div className="absolute inset-[-8%]" style={on ? { x: near.x, y: near.y, background: "radial-gradient(120% 85% at 50% -14%, var(--bokeh-1), transparent 60%)" } : { background: "radial-gradient(120% 85% at 50% -14%, var(--bokeh-1), transparent 60%)" }} />
      <motion.div className="absolute inset-[-8%]" style={on ? { x: far.x, y: far.y, background: "radial-gradient(95% 75% at 110% 112%, var(--bokeh-2), transparent 62%)" } : { background: "radial-gradient(95% 75% at 110% 112%, var(--bokeh-2), transparent 62%)" }} />
      <motion.div className="absolute inset-[-8%]" style={on ? { x: aurora.x, y: aurora.y, background: "radial-gradient(80% 70% at -10% 55%, var(--bokeh-3), transparent 64%)" } : { background: "radial-gradient(80% 70% at -10% 55%, var(--bokeh-3), transparent 64%)" }} />

      {/* Vignette — settles focus toward the centre. */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(125% 120% at 50% 30%, transparent 55%, var(--vignette) 100%)" }}
      />

      {/* Fine film grain so the flat ground reads as a rich material. */}
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
