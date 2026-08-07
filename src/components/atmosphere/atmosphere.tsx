"use client";

/**
 * Atmosphere — the calm, cinematic background.
 * A single Canvas 2D layer: slow-drifting aurora gradients, soft gold particles,
 * a faint light gradient, and gentle mouse parallax. Tuned for 60fps:
 *  - device pixel ratio capped
 *  - particle count scaled to viewport and capped
 *  - one rAF loop, paused when the tab is hidden
 *  - honours prefers-reduced-motion (renders a single still frame)
 * Colors follow the active theme.
 */
import { useEffect, useRef } from "react";
import { useTheme } from "@/components/providers/theme-provider";
import { clamp } from "@/lib/utils";

type Palette = {
  aurora: [number, number, number][];
  particle: [number, number, number];
};

const PALETTES: Record<"dark" | "light", Palette> = {
  dark: {
    aurora: [
      [212, 175, 106], // gold
      [70, 96, 150], // deep blue
      [150, 130, 90], // warm sand
    ],
    particle: [236, 209, 153],
  },
  light: {
    aurora: [
      [198, 154, 63],
      [120, 140, 190],
      [190, 170, 130],
    ],
    particle: [140, 115, 60],
  },
};

interface Blob {
  baseX: number;
  baseY: number;
  r: number;
  color: [number, number, number];
  alpha: number;
  phase: number;
  speed: number;
  ax: number;
  ay: number;
}

interface Particle {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  a: number;
  tw: number; // twinkle phase
}

export function Atmosphere({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolved } = useTheme();
  const resolvedRef = useRef(resolved);
  resolvedRef.current = resolved;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    let blobs: Blob[] = [];
    let particles: Particle[] = [];

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = clamp(window.devicePixelRatio || 1, 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const pal = PALETTES[resolvedRef.current];
      const short = Math.min(width, height);

      blobs = [
        { baseX: 0.2, baseY: 0.25, r: short * 0.75, color: pal.aurora[0], alpha: 0.5, phase: 0, speed: 0.06, ax: 0.05, ay: 0.04 },
        { baseX: 0.82, baseY: 0.2, r: short * 0.7, color: pal.aurora[1], alpha: 0.55, phase: 2.1, speed: 0.05, ax: 0.06, ay: 0.05 },
        { baseX: 0.7, baseY: 0.85, r: short * 0.85, color: pal.aurora[2], alpha: 0.4, phase: 4.2, speed: 0.04, ax: 0.05, ay: 0.04 },
        { baseX: 0.35, baseY: 0.8, r: short * 0.6, color: pal.aurora[0], alpha: 0.32, phase: 1.3, speed: 0.055, ax: 0.045, ay: 0.05 },
      ];

      const count = Math.round(clamp((width * height) / 26000, 24, 70));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.6 + 0.4,
        vx: (Math.random() - 0.5) * 0.12,
        vy: -(Math.random() * 0.14 + 0.03),
        a: Math.random() * 0.5 + 0.2,
        tw: Math.random() * Math.PI * 2,
      }));
    };

    const drawFrame = (t: number) => {
      const pal = PALETTES[resolvedRef.current];
      ctx.clearRect(0, 0, width, height);

      // Ease pointer for smooth parallax.
      pointer.x += (pointer.tx - pointer.x) * 0.04;
      pointer.y += (pointer.ty - pointer.y) * 0.04;
      const px = (pointer.x - 0.5) * 2;
      const py = (pointer.y - 0.5) * 2;

      // Aurora blobs (additive glow).
      ctx.globalCompositeOperation = "lighter";
      for (const b of blobs) {
        const drift = reduced ? 0 : Math.sin(t * 0.00012 * (b.speed * 12) + b.phase);
        const drift2 = reduced ? 0 : Math.cos(t * 0.0001 * (b.speed * 12) + b.phase);
        const cx = (b.baseX + drift * b.ax + px * 0.03) * width;
        const cy = (b.baseY + drift2 * b.ay + py * 0.03) * height;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, b.r);
        const [r, gr, bl] = b.color;
        g.addColorStop(0, `rgba(${r},${gr},${bl},${b.alpha})`);
        g.addColorStop(0.5, `rgba(${r},${gr},${bl},${b.alpha * 0.35})`);
        g.addColorStop(1, `rgba(${r},${gr},${bl},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, b.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Particles.
      const [pr, pg, pb] = pal.particle;
      for (const p of particles) {
        if (!reduced) {
          p.x += p.vx + px * 0.06;
          p.y += p.vy + py * 0.04;
          p.tw += 0.02;
          if (p.y < -4) p.y = height + 4;
          if (p.x < -4) p.x = width + 4;
          if (p.x > width + 4) p.x = -4;
        }
        const twinkle = reduced ? p.a : p.a * (0.6 + 0.4 * Math.sin(p.tw));
        ctx.beginPath();
        ctx.fillStyle = `rgba(${pr},${pg},${pb},${twinkle})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";
    };

    let raf = 0;
    let running = true;
    const loop = (t: number) => {
      if (!running) return;
      drawFrame(t);
      raf = requestAnimationFrame(loop);
    };

    const onPointer = (e: PointerEvent) => {
      pointer.tx = e.clientX / window.innerWidth;
      pointer.ty = e.clientY / window.innerHeight;
    };
    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        raf = requestAnimationFrame(loop);
      }
    };

    let resizeTimer: number;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(build, 150);
    };

    build();
    if (reduced) {
      drawFrame(0);
    } else {
      raf = requestAnimationFrame(loop);
    }

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [resolved]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className}
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: -10 }}
    />
  );
}
