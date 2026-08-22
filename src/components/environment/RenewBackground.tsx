"use client";

import { useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useEnvironmentTier } from "@/hooks/useEnvironmentTier";
import { useTheme } from "@/hooks/useTheme";
import AnimatedGradient, {
  type GradientCustomConfig,
} from "@/components/ui/animated-gradient";

/**
 * RENEW — cinematic environment. A slow, liquid midnight-blue flow (WebGL) is
 * the living base; the Renew vignette + film grain sit on top for identity.
 * The FOG DESIGN rotates on a 3-hour schedule (same midnight-blue palette, only
 * the flow/shape changes) and updates live as each window turns over. Falls back
 * to a calm CSS bokeh field when reduced motion is preferred or the device is
 * low-power. Fixed behind everything; never intercepts pointers.
 */

const DARK_COLORS = { color1: "#05081a", color2: "#1f3c86", color3: "#5f8ef5" } as const;
const LIGHT_COLORS = { color1: "#dde6fb", color2: "#8fb0f2", color3: "#eef3fe" } as const;

/** Five fog "designs" — identical palette, different flow/shape/rotation. */
const DARK_VARIANTS: GradientCustomConfig[] = [
  { ...DARK_COLORS, rotation: 24, proportion: 44, scale: 0.5, speed: 9, distortion: 4, swirl: 52, swirlIterations: 7, softness: 100, shape: "Edge", shapeSize: 42 },
  { ...DARK_COLORS, rotation: 132, proportion: 52, scale: 0.56, speed: 8, distortion: 3, swirl: 40, swirlIterations: 7, softness: 100, shape: "Stripes", shapeSize: 56, offset: 0.2 },
  { ...DARK_COLORS, rotation: 212, proportion: 38, scale: 0.62, speed: 10, distortion: 6, swirl: 66, swirlIterations: 8, softness: 100, shape: "Edge", shapeSize: 34 },
  { ...DARK_COLORS, rotation: 300, proportion: 48, scale: 0.5, speed: 8, distortion: 5, swirl: 30, swirlIterations: 6, softness: 100, shape: "Checks", shapeSize: 62, offset: 0.4 },
  { ...DARK_COLORS, rotation: 70, proportion: 42, scale: 0.58, speed: 9, distortion: 4, swirl: 58, swirlIterations: 7, softness: 100, shape: "Edge", shapeSize: 48, offset: 0.6 },
];

const LIGHT_VARIANTS: GradientCustomConfig[] = [
  { ...LIGHT_COLORS, rotation: 24, proportion: 47, scale: 0.5, speed: 7, distortion: 4, swirl: 44, swirlIterations: 7, softness: 100, shape: "Edge", shapeSize: 44 },
  { ...LIGHT_COLORS, rotation: 140, proportion: 54, scale: 0.56, speed: 6, distortion: 3, swirl: 36, swirlIterations: 7, softness: 100, shape: "Stripes", shapeSize: 58, offset: 0.25 },
  { ...LIGHT_COLORS, rotation: 220, proportion: 40, scale: 0.6, speed: 8, distortion: 5, swirl: 58, swirlIterations: 8, softness: 100, shape: "Edge", shapeSize: 36 },
  { ...LIGHT_COLORS, rotation: 305, proportion: 50, scale: 0.5, speed: 6, distortion: 4, swirl: 28, swirlIterations: 6, softness: 100, shape: "Checks", shapeSize: 64, offset: 0.45 },
  { ...LIGHT_COLORS, rotation: 78, proportion: 45, scale: 0.58, speed: 7, distortion: 4, swirl: 50, swirlIterations: 7, softness: 100, shape: "Edge", shapeSize: 50, offset: 0.6 },
];

const THREE_HOURS = 3 * 60 * 60 * 1000;

/**
 * The index of the current fixed-length time window, updated live when the
 * window turns over. Hydration-safe (server renders window 0) and never sets
 * state inside an effect — the store schedules its own timeouts.
 */
function useRotatingIndex(periodMs: number, count: number): number {
  return useSyncExternalStore(
    (onChange) => {
      let timer: ReturnType<typeof setTimeout>;
      const tick = () => {
        const wait = periodMs - (Date.now() % periodMs) + 50;
        timer = setTimeout(() => { onChange(); tick(); }, wait);
      };
      tick();
      return () => clearTimeout(timer);
    },
    () => Math.floor(Date.now() / periodMs) % count,
    () => 0,
  );
}

export function RenewBackground() {
  const reduced = useReducedMotion();
  const tier = useEnvironmentTier();
  const { theme } = useTheme();
  const live = !(reduced || tier === "soft2d");
  const variants = theme === "light" ? LIGHT_VARIANTS : DARK_VARIANTS;
  const index = useRotatingIndex(THREE_HOURS, variants.length);
  const config = variants[index % variants.length]!;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg, var(--bg-tint-1) 0%, var(--bg-tint-2) 55%, var(--bg-tint-3) 100%)",
        }}
      />

      {live ? (
        <AnimatedGradient
          key={`${theme}-${index}`}
          config={config}
          className="opacity-90 mix-blend-soft-light transition-opacity duration-1000"
          style={{ inset: "-10%" }}
        />
      ) : (
        <>
          <div
            className="absolute -left-[10%] -top-[15%] h-[55vmax] w-[55vmax] rounded-full blur-[80px]"
            style={{ background: "radial-gradient(circle, var(--bokeh-1), transparent 65%)" }}
          />
          <div
            className="absolute right-[-15%] top-[10%] h-[50vmax] w-[50vmax] rounded-full blur-[90px]"
            style={{ background: "radial-gradient(circle, var(--bokeh-2), transparent 65%)" }}
          />
        </>
      )}

      {live && (
        <>
          {/* Aurora I — the primary midnight glow, breathing top-left. */}
          <motion.div
            className="absolute -left-[12%] -top-[18%] h-[62vmax] w-[62vmax] rounded-full blur-[120px]"
            style={{ background: "radial-gradient(circle, var(--bokeh-1), transparent 64%)" }}
            animate={{ x: [0, 70, -30, 0], y: [0, 46, 14, 0], scale: [1, 1.14, 1], opacity: [0.5, 0.82, 0.5] }}
            transition={{ duration: 46, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Aurora II — a deeper counter-drift, bottom-right. */}
          <motion.div
            className="absolute right-[-16%] bottom-[-18%] h-[58vmax] w-[58vmax] rounded-full blur-[140px]"
            style={{ background: "radial-gradient(circle, var(--bokeh-3), transparent 66%)" }}
            animate={{ x: [0, -60, 20, 0], y: [0, -40, -10, 0], scale: [1.06, 0.9, 1.06], opacity: [0.45, 0.85, 0.45] }}
            transition={{ duration: 60, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Aurora III — a bright accent ribbon slowly sweeping the middle. */}
          <motion.div
            className="absolute left-1/2 top-[34%] h-[46vmax] w-[74vmax] -translate-x-1/2 rounded-[46%] blur-[130px]"
            style={{ background: "radial-gradient(ellipse at center, var(--bokeh-2), transparent 60%)" }}
            animate={{ x: [-50, 50, -50], y: [0, -26, 0], rotate: [-9, 9, -9], opacity: [0.3, 0.58, 0.3] }}
            transition={{ duration: 42, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}

      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 120% at 50% 30%, transparent 55%, var(--vignette) 100%)",
        }}
      />
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
