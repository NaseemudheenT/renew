"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import { useEnvironmentTier } from "@/hooks/useEnvironmentTier";

/**
 * RENEW — a living night sky. Stars breathe (gentle twinkle), drift with depth
 * (near stars move faster than far ones → parallax → real sense of space), and
 * once in a while an elegant shooting star crosses. Calm but alive — premium
 * without ever distracting a person managing money.
 *
 * One requestAnimationFrame loop, density capped for performance, and it renders
 * a single STATIC frame when reduced motion is preferred or the device is
 * low-power. Dark theme only — the daylight world has no stars.
 */

interface Star {
  x: number;
  y: number;
  r: number;
  base: number; // baseline opacity
  amp: number; // twinkle amplitude
  phase: number;
  speed: number; // twinkle speed
  drift: number; // px/sec horizontal parallax
  glow: boolean;
}

interface Shoot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  len: number;
}

export function StarField() {
  const { theme } = useTheme();
  const reduced = useReducedMotion();
  const tier = useEnvironmentTier();
  const ref = useRef<HTMLCanvasElement | null>(null);
  const staticMode = Boolean(reduced) || tier === "soft2d";

  useEffect(() => {
    if (theme === "light") return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let stars: Star[] = [];
    let shooting: Shoot[] = [];
    let raf = 0;
    let last = 0;
    let nextShoot = 3000 + Math.random() * 6000;

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(190, Math.round((w * h) / 7800));
      stars = Array.from({ length: count }, () => {
        const depth = Math.random(); // 0 far … 1 near
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.3 + depth * 1.3,
          base: 0.12 + Math.random() * 0.5,
          amp: 0.1 + Math.random() * 0.32,
          phase: Math.random() * Math.PI * 2,
          speed: 0.25 + Math.random() * 0.75,
          drift: 0.15 + depth * 0.55,
          glow: depth > 0.74,
        };
      });
    };

    const drawStar = (s: Star, alpha: number) => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212,226,255,${alpha})`;
      ctx.fill();
      if (s.glow) {
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 8);
        g.addColorStop(0, `rgba(150,185,255,${alpha * 0.4})`);
        g.addColorStop(1, "rgba(150,185,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 8, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const renderStatic = () => {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) drawStar(s, s.base);
    };

    const spawnShoot = () => {
      const fromLeft = Math.random() > 0.5;
      shooting.push({
        x: fromLeft ? -60 : w + 60,
        y: Math.random() * h * 0.55,
        vx: (fromLeft ? 1 : -1) * (520 + Math.random() * 320),
        vy: 130 + Math.random() * 130,
        life: 0,
        max: 0.9 + Math.random() * 0.5,
        len: 90 + Math.random() * 90,
      });
    };

    const frame = (now: number) => {
      if (!last) last = now;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      ctx.clearRect(0, 0, w, h);

      for (const s of stars) {
        s.x += s.drift * dt;
        if (s.x > w + 2) s.x = -2;
        const tw = s.base + Math.sin(t * s.speed + s.phase) * s.amp;
        drawStar(s, Math.max(0, Math.min(1, tw)));
      }

      nextShoot -= dt * 1000;
      if (nextShoot <= 0) {
        spawnShoot();
        nextShoot = 7000 + Math.random() * 9000;
      }
      shooting = shooting.filter((sh) => sh.life < sh.max);
      for (const sh of shooting) {
        sh.life += dt;
        sh.x += sh.vx * dt;
        sh.y += sh.vy * dt;
        const alpha = Math.sin((sh.life / sh.max) * Math.PI);
        const mag = Math.hypot(sh.vx, sh.vy) || 1;
        const tailX = sh.x - (sh.vx / mag) * sh.len;
        const tailY = sh.y - (sh.vy / mag) * sh.len;
        const grad = ctx.createLinearGradient(sh.x, sh.y, tailX, tailY);
        grad.addColorStop(0, `rgba(224,234,255,${0.9 * alpha})`);
        grad.addColorStop(1, "rgba(224,234,255,0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(sh.x, sh.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
      }

      raf = requestAnimationFrame(frame);
    };

    build();
    renderStatic(); // instant first paint — no blank flash before the first frame
    if (!staticMode) {
      raf = requestAnimationFrame(frame);
    }

    let resizeTimer: number | undefined;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        build();
        if (staticMode) renderStatic();
      }, 200);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(resizeTimer);
    };
  }, [theme, staticMode]);

  if (theme === "light") return null;
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
      style={{ opacity: 0.9, mixBlendMode: "screen" }}
    />
  );
}
