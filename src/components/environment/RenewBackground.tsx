"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEnvironmentTier } from "@/hooks/useEnvironmentTier";
import { useTheme } from "@/hooks/useTheme";
import AnimatedGradient, {
  type GradientCustomConfig,
} from "@/components/ui/animated-gradient";

/**
 * RENEW — cinematic environment. A slow, liquid champagne-gold flow (WebGL) is
 * the living base; the Renew vignette + film grain sit on top for identity.
 * Falls back to a calm CSS bokeh field when reduced motion is preferred or the
 * device is low-power. Fixed behind everything; never intercepts pointers.
 */

const DARK: GradientCustomConfig = {
  color1: "#0b0d12",
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
  shape: "Edge",
  shapeSize: 40,
};

const LIGHT: GradientCustomConfig = {
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
  shape: "Edge",
  shapeSize: 42,
};

export function RenewBackground() {
  const reduced = useReducedMotion();
  const tier = useEnvironmentTier();
  const { theme } = useTheme();
  const live = !(reduced || tier === "soft2d");
  const config = theme === "light" ? LIGHT : DARK;

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
          config={config}
          className="opacity-70 mix-blend-soft-light"
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
        <motion.div
          className="absolute -left-[8%] -top-[12%] h-[52vmax] w-[52vmax] rounded-full blur-[90px]"
          style={{ background: "radial-gradient(circle, var(--bokeh-1), transparent 66%)" }}
          animate={{ x: [0, 50, -20, 0], y: [0, 36, 8, 0] }}
          transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }}
        />
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
