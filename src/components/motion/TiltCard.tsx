"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";

/**
 * A premium 3D tilt surface — the card leans toward the cursor in real 3D with a
 * soft moving glare, then springs back. Pointer-only (fine pointers); touch taps
 * and reduced-motion leave it perfectly still.
 *
 * Hydration-safe: the markup is identical on the server and the first client
 * render (tilt stays neutral), and pointer tracking only switches on AFTER mount
 * once we know it's a fine-pointer, motion-OK device — so it never causes a
 * server/client mismatch.
 *
 *   <TiltCard className="relative"><GlassCard>…</GlassCard></TiltCard>
 */
export function TiltCard({
  children,
  className,
  max = 8,
  glare = true,
}: {
  children: ReactNode;
  className?: string;
  /** Max tilt in degrees. */
  max?: number;
  glare?: boolean;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [max, -max]), { stiffness: 220, damping: 20 });
  const ry = useSpring(useTransform(px, [0, 1], [-max, max]), { stiffness: 220, damping: 20 });
  const glareBg = useTransform(px, (x) => `radial-gradient(60% 60% at ${x * 100}% 0%, rgba(255,255,255,0.12), transparent 60%)`);

  useEffect(() => {
    if (reduced) return;
    if (typeof window === "undefined" || !window.matchMedia?.("(hover: hover) and (pointer: fine)").matches) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(true);
  }, [reduced]);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!enabled || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  }
  function reset() { px.set(0.5); py.set(0.5); }

  return (
    <motion.div
      ref={ref}
      className={className}
      onPointerMove={enabled ? onMove : undefined}
      onPointerLeave={enabled ? reset : undefined}
      style={enabled ? { rotateX: rx, rotateY: ry, transformPerspective: 1000, transformStyle: "preserve-3d" } : undefined}
    >
      {children}
      {glare && enabled && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 hover:opacity-100"
          style={{ background: glareBg }}
        />
      )}
    </motion.div>
  );
}
