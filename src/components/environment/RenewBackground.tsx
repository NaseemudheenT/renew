"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useReducedMotion } from "framer-motion";
import { subscribeA11y, getReduceMotion } from "@/lib/a11y";
import { cn } from "@/lib/utils";

/**
 * RENEW — the Financial-OS ground. No live WebGL fog any more: the app sits on a
 * calm deep-space **void** (dark) / soft daylight (light), with the spec's faint
 * "Scroll Tide" — a whisper of a teal data-flow field that drifts very slowly and
 * parallaxes at ~40% of scroll, so foreground cards feel like they float above a
 * live current. Text never moves; only this field and its depth glows do.
 *
 * Fixed behind everything, never intercepts pointers. Honours reduced-motion
 * (in-app toggle + OS): the field goes perfectly still.
 */
export function RenewBackground() {
  const osReduced = useReducedMotion();
  const a11yReduced = useSyncExternalStore(subscribeA11y, getReduceMotion, () => false);
  const still = Boolean(osReduced) || a11yReduced;
  const tideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (still || typeof window === "undefined") return;
    let raf = 0;
    const apply = () => {
      raf = 0;
      const y = window.scrollY || 0;
      // Field rises at 40% of scroll — true parallax depth (spec §2).
      if (tideRef.current) tideRef.current.style.transform = `translate3d(0, ${(-y * 0.4).toFixed(1)}px, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    apply();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [still]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Calm depth — two soft, static signal glows anchoring the space. */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(120% 85% at 50% -12%, var(--bokeh-1), transparent 58%)" }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(95% 70% at 108% 112%, var(--bokeh-2), transparent 60%)" }}
      />

      {/* Scroll Tide — the faint data-flow field. Outer node carries the
          scroll parallax transform; inner node carries the slow ambient drift. */}
      <div ref={tideRef} className="absolute inset-x-0 -inset-y-[55%] will-change-transform">
        <div
          className={cn("size-full", !still && "renew-tide-drift")}
          style={{
            backgroundImage:
              "radial-gradient(var(--tide-dot) 1px, transparent 1.7px), linear-gradient(var(--tide-line) 1px, transparent 1px)",
            backgroundSize: "38px 38px, 100% 220px",
            backgroundPosition: "0 0, 0 0",
          }}
        />
      </div>

      {/* Vignette — pulls focus to the centre, deepens the space at the edges. */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(125% 120% at 50% 28%, transparent 52%, var(--vignette) 100%)" }}
      />

      {/* Fine film grain so the flat void never looks like dead plastic. */}
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
