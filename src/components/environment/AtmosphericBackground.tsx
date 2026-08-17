"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEnvironmentTier } from "@/hooks/useEnvironmentTier";
import { useTheme } from "@/hooks/useTheme";
import AnimatedGradient, {
  type GradientCustomConfig,
} from "@/components/ui/animated-gradient";

/**
 * RENEW — the cinematic environment.
 *
 * A slow, liquid champagne-gold flow (WebGL) forms the living base, with the
 * Renew vignette + film grain layered on top to keep the brand identity. When
 * WebGL isn't available, reduced motion is preferred, or we're on the low-power
 * tier, we fall back to the calm CSS bokeh atmosphere (no continuous GPU work).
 * Fixed behind all content; never intercepts pointer events.
 */

// Deep champagne-gold night — muted, premium, never bright/neon.
const DARK_GRADIENT: GradientCustomConfig = {
  color1: "#120e07",
  color2: "#6b4e1c",
  color3: "#b98f45",
  rotation: 24,
  proportion: 42,
  scale: 0.5,
  speed: 7,
  distortion: 3,
  swirl: 42,
  swirlIterations: 6,
  softness: 100,
  offset: 0,
  shape: "Edge",
  shapeSize: 40,
};

// Warm champagne daylight — the same world by day.
const LIGHT_GRADIENT: GradientCustomConfig = {
  color1: "#e9dcbf",
  color2: "#d3ad63",
  color3: "#f5edda",
  rotation: 24,
  proportion: 46,
  scale: 0.5,
  speed: 6,
  distortion: 3,
  swirl: 38,
  swirlIterations: 6,
  softness: 100,
  offset: 0,
  shape: "Edge",
  shapeSize: 42,
};

export function AtmosphericBackground() {
  const reduced = useReducedMotion();
  const tier = useEnvironmentTier();
  const { theme } = useTheme();
  const still = reduced || tier === "soft2d";
  // Only run the continuous WebGL flow when motion is welcome & the device can.
  const liveGradient = !still;
  const config = theme === "light" ? LIGHT_GRADIENT : DARK_GRADIENT;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Base tonal wash (also the fallback base when the gradient is off) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg, var(--bg-tint-1) 0%, var(--bg-tint-2) 55%, var(--bg-tint-3) 100%)",
        }}
      />

      {liveGradient ? (
        // Living champagne-gold flow — subtle, blended into the base.
        <AnimatedGradient
          config={config}
          className="opacity-70 mix-blend-soft-light"
          style={{ inset: "-10%" }}
        />
      ) : (
        // Calm CSS bokeh fallback (no GPU loop).
        <>
          <div
            className="absolute -left-[10%] -top-[15%] h-[55vmax] w-[55vmax] rounded-full blur-[80px]"
            style={{ background: "radial-gradient(circle, var(--bokeh-1), transparent 65%)" }}
          />
          <div
            className="absolute right-[-15%] top-[10%] h-[50vmax] w-[50vmax] rounded-full blur-[90px]"
            style={{ background: "radial-gradient(circle, var(--bokeh-2), transparent 65%)" }}
          />
          <div
            className="absolute bottom-[-20%] left-[20%] h-[48vmax] w-[48vmax] rounded-full blur-[90px]"
            style={{ background: "radial-gradient(circle, var(--bokeh-3), transparent 68%)" }}
          />
        </>
      )}

      {/* One drifting champagne light pool for warmth even over the flow */}
      {liveGradient && (
        <motion.div
          className="absolute -left-[8%] -top-[12%] h-[52vmax] w-[52vmax] rounded-full blur-[90px]"
          style={{ background: "radial-gradient(circle, var(--bokeh-1), transparent 66%)" }}
          animate={{ x: [0, 50, -20, 0], y: [0, 36, 8, 0] }}
          transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

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
