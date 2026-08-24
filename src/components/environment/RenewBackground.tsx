"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEnvironmentTier } from "@/hooks/useEnvironmentTier";
import { useTheme } from "@/hooks/useTheme";
import AnimatedGradient, {
  type GradientCustomConfig,
} from "@/components/ui/animated-gradient";

/**
 * RENEW — the one, fixed cinematic environment. A slow, liquid midnight-blue fog
 * (WebGL) with the Renew vignette + film grain on top. It is intentionally a
 * single, constant look (no rotation) — the calm base of the whole product.
 * Falls back to a calm CSS bokeh field under reduced-motion / low-power devices.
 * Fixed behind everything; never intercepts pointers.
 */

const DARK: GradientCustomConfig = {
  color1: "#05081a",
  color2: "#1f3c86",
  color3: "#5f8ef5",
  rotation: 24,
  proportion: 44,
  scale: 0.5,
  speed: 9,
  distortion: 4,
  swirl: 52,
  swirlIterations: 7,
  softness: 100,
  shape: "Edge",
  shapeSize: 42,
};

const LIGHT: GradientCustomConfig = {
  color1: "#aac1ef",
  color2: "#6f9aec",
  color3: "#dbe8fc",
  rotation: 24,
  proportion: 46,
  scale: 0.5,
  speed: 7,
  distortion: 4,
  swirl: 46,
  swirlIterations: 7,
  softness: 100,
  shape: "Edge",
  shapeSize: 44,
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
          key={theme}
          config={config}
          className="opacity-90 mix-blend-soft-light"
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
