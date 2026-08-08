"use client";

/**
 * Atmosphere — the calm, cinematic background (Canvas 2D base layer).
 * Slow-drifting aurora, soft light shafts, depth bokeh, and fine particles with
 * gentle mouse parallax. Tuned for 60fps:
 *  - device pixel ratio capped
 *  - counts scaled to viewport and capped
 *  - one rAF loop, paused when the tab is hidden
 *  - honours prefers-reduced-motion (renders a single still frame)
 * Colors follow the active theme. A subtle vignette + grain live in
 * CinematicOverlay, layered above this.
 */
import { useEffect, useRef } from "react";
import { useTheme } from "@/components/providers/theme-provider";
import { clamp } from "@/lib/utils";

type Palette = {
  aurora: { color: [number, number, number]; alpha: number }[];
  particle: [number, number, number];
  ray: [number, number, number];
  rayAlpha: number;
};

const PALETTES: Record<"dark" | "light", Palette> = {
  dark: {
    aurora: [
      { color: [212, 175, 106], alpha: 0.5 }, // gold
      { color: [64, 92, 150], alpha: 0.55 }, // deep blue
      { color: [150, 128, 88], alpha: 0.4 }, // warm sand
      { color: [212, 175, 106], alpha: 0.3 },
    ],
    particle: [236, 209, 153],
    ray: [212, 175, 106],
    rayAlpha: 0.05,
  },
  light: {
    // Toned down so the center stays crisp and elegant, never milky.
    aurora: [
      { color: [206, 162, 74], alpha: 0.24 },
      { color: [120, 140, 190], alpha: 0.2 },
      { color: [198, 176, 138], alpha: 0.16 },
      { color: [206, 162, 74], alpha: 0.14 },
    ],
    particle: [150, 120, 62],
    ray: [206, 162, 74],
    rayAlpha: 0.04,
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
  tw: number;
}
interface Bokeh {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  a: number;
}
interface Ray {
  x: number;
  w: number;
  angle: number;
  phase: number;
  speed: number;
}

export function Atmosphere2D({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolved } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;

    const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    let blobs: Blob[] = [];
    let particles: Particle[] = [];
    let bokeh: Bokeh[] = [];
    let rays: Ray[] = [];

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      // Fall back to the viewport if the box hasn't been laid out yet; a
      // ResizeObserver re-runs build() once the real size is known.
      width = rect.width || document.documentElement.clientWidth || window.innerWidth || 0;
      height = rect.height || document.documentElement.clientHeight || window.innerHeight || 0;
      if (width === 0 || height === 0) return;
      const dpr = clamp(window.devicePixelRatio || 1, 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const pal = PALETTES[resolved];
      const short = Math.min(width, height);

      blobs = [
        { baseX: 0.18, baseY: 0.22, r: short * 0.8, phase: 0, speed: 0.06, ax: 0.05, ay: 0.04, ...pal.aurora[0] },
        { baseX: 0.84, baseY: 0.18, r: short * 0.72, phase: 2.1, speed: 0.05, ax: 0.06, ay: 0.05, ...pal.aurora[1] },
        { baseX: 0.72, baseY: 0.86, r: short * 0.9, phase: 4.2, speed: 0.04, ax: 0.05, ay: 0.04, ...pal.aurora[2] },
        { baseX: 0.32, baseY: 0.82, r: short * 0.62, phase: 1.3, speed: 0.055, ax: 0.045, ay: 0.05, ...pal.aurora[3] },
      ];

      const count = Math.round(clamp((width * height) / 26000, 24, 72));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.6 + 0.4,
        vx: (Math.random() - 0.5) * 0.12,
        vy: -(Math.random() * 0.14 + 0.03),
        a: Math.random() * 0.5 + 0.2,
        tw: Math.random() * Math.PI * 2,
      }));

      // A few large, soft out-of-focus motes for real depth.
      const bokehCount = Math.round(clamp((width * height) / 240000, 4, 9));
      bokeh = Array.from({ length: bokehCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * short * 0.05 + short * 0.03,
        vx: (Math.random() - 0.5) * 0.05,
        vy: -(Math.random() * 0.05 + 0.01),
        a: Math.random() * 0.05 + 0.02,
      }));

      // Soft diagonal light shafts.
      rays = [
        { x: 0.28, w: short * 0.5, angle: -0.35, phase: 0, speed: 0.04 },
        { x: 0.62, w: short * 0.42, angle: -0.35, phase: 2.5, speed: 0.03 },
      ];
    };

    const drawFrame = (t: number) => {
      const pal = PALETTES[resolved];
      ctx.clearRect(0, 0, width, height);

      pointer.x += (pointer.tx - pointer.x) * 0.04;
      pointer.y += (pointer.ty - pointer.y) * 0.04;
      const px = (pointer.x - 0.5) * 2;
      const py = (pointer.y - 0.5) * 2;

      ctx.globalCompositeOperation = "lighter";

      // Aurora blobs.
      for (const b of blobs) {
        const drift = reduced ? 0 : Math.sin(t * 0.00012 * (b.speed * 12) + b.phase);
        const drift2 = reduced ? 0 : Math.cos(t * 0.0001 * (b.speed * 12) + b.phase);
        const cx = (b.baseX + drift * b.ax + px * 0.03) * width;
        const cy = (b.baseY + drift2 * b.ay + py * 0.03) * height;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, b.r);
        const [r, gr, bl] = b.color;
        g.addColorStop(0, `rgba(${r},${gr},${bl},${b.alpha})`);
        g.addColorStop(0.5, `rgba(${r},${gr},${bl},${b.alpha * 0.32})`);
        g.addColorStop(1, `rgba(${r},${gr},${bl},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, b.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Light shafts — feathered beams (soft on the sides, extending well
      // beyond the viewport so there are no hard end caps).
      const [rr, rg, rb] = pal.ray;
      for (const ray of rays) {
        const sway = reduced ? 0 : Math.sin(t * 0.0001 * (ray.speed * 12) + ray.phase) * 0.04;
        const cx = (ray.x + sway + px * 0.02) * width;
        ctx.save();
        ctx.translate(cx, height * 0.5);
        ctx.rotate(ray.angle);
        // Gradient across the beam width for soft feathered edges.
        const grad = ctx.createLinearGradient(-ray.w / 2, 0, ray.w / 2, 0);
        grad.addColorStop(0, `rgba(${rr},${rg},${rb},0)`);
        grad.addColorStop(0.5, `rgba(${rr},${rg},${rb},${pal.rayAlpha})`);
        grad.addColorStop(1, `rgba(${rr},${rg},${rb},0)`);
        ctx.fillStyle = grad;
        const len = Math.hypot(width, height) * 2.2;
        ctx.fillRect(-ray.w / 2, -len / 2, ray.w, len);
        ctx.restore();
      }

      // Bokeh depth motes.
      for (const bo of bokeh) {
        if (!reduced) {
          bo.x += bo.vx + px * 0.03;
          bo.y += bo.vy + py * 0.02;
          if (bo.y < -bo.r) bo.y = height + bo.r;
          if (bo.x < -bo.r) bo.x = width + bo.r;
          if (bo.x > width + bo.r) bo.x = -bo.r;
        }
        const [pr, pg, pb] = pal.particle;
        const g = ctx.createRadialGradient(bo.x, bo.y, 0, bo.x, bo.y, bo.r);
        g.addColorStop(0, `rgba(${pr},${pg},${pb},${bo.a})`);
        g.addColorStop(1, `rgba(${pr},${pg},${pb},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(bo.x, bo.y, bo.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Fine particles.
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
      const w = window.innerWidth || document.documentElement.clientWidth || 1;
      const h = window.innerHeight || document.documentElement.clientHeight || 1;
      pointer.tx = e.clientX / w;
      pointer.ty = e.clientY / h;
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
    if (reduced) drawFrame(0);
    else raf = requestAnimationFrame(loop);

    // Re-size when the canvas box changes (covers first-layout 0-size and
    // container resizes, not just window resizes).
    const ro = new ResizeObserver(onResize);
    ro.observe(canvas);

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [resolved]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`atmosphere-fade ${className ?? ""}`}
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: -10 }}
    />
  );
}
