"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/hooks/useTheme";

/**
 * A subtle, STATIC night-sky starfield — drawn once to a canvas, so it costs
 * nothing after paint (no animation loop). It reinforces Renew's midnight-blue
 * identity with premium depth without ever feeling busy. Dark theme only; the
 * light "daylight" world has no stars.
 */
export function StarField() {
  const { theme } = useTheme();
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (theme === "light") return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Density scales with area, capped for performance on large screens.
      const count = Math.min(170, Math.round((w * h) / 8500));
      for (let i = 0; i < count; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const r = Math.random() * 1.1 + 0.3;
        const a = Math.random() * 0.5 + 0.14;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 226, 255, ${a})`;
        ctx.fill();
        // A few brighter stars get a soft cool-blue glow.
        if (r > 1.1 && Math.random() > 0.55) {
          const g = ctx.createRadialGradient(x, y, 0, x, y, r * 7);
          g.addColorStop(0, `rgba(150, 185, 255, ${a * 0.45})`);
          g.addColorStop(1, "rgba(150,185,255,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, r * 7, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    draw();
    let resizeTimer: number | undefined;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(draw, 200);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(resizeTimer);
    };
  }, [theme]);

  if (theme === "light") return null;
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
      style={{ opacity: 0.75, mixBlendMode: "screen" }}
    />
  );
}
