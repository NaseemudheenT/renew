"use client";

import { forwardRef, type ReactNode } from "react";
import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
} from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * RENEW liquid glass — the layered refractive treatment adapted from the
 * supplied iOS-26 GlassEffect component to Renew's champagne-gold material.
 * No demo content.
 *
 * Refraction is provided by the global `#renew-glass` SVG filter, already
 * mounted once near the app root (see components/ui/GlassFilter.tsx), so we do
 * not re-declare it here — a second filter with the same id would clash. Every
 * colour comes from the theme-aware CSS variables in globals.css, so these
 * surfaces read correctly in both the dark and light champagne worlds.
 */

interface GlassProps {
  children: ReactNode;
  className?: string;
  /** Apply the `#renew-glass` displacement to the blur layer. */
  refract?: boolean;
}

/** Layered liquid-glass surface: refractive blur → champagne tint → specular rim. */
export const GlassSurface = forwardRef<
  HTMLDivElement,
  GlassProps & HTMLMotionProps<"div">
>(function GlassSurface(
  { children, className, refract = true, ...props },
  ref,
) {
  return (
    <motion.div
      ref={ref}
      className={cn(
        "relative overflow-hidden rounded-3xl text-[var(--text-strong)]",
        className,
      )}
      style={{ boxShadow: "var(--glass-shadow)" }}
      {...props}
    >
      {/* refractive blur layer */}
      <div
        className="absolute inset-0 z-0 rounded-[inherit]"
        style={{
          backdropFilter:
            "blur(var(--glass-blur)) saturate(var(--glass-saturate))",
          WebkitBackdropFilter:
            "blur(var(--glass-blur)) saturate(var(--glass-saturate))",
          filter: refract ? "url(#renew-glass)" : undefined,
          isolation: "isolate",
        }}
      />
      {/* champagne tint */}
      <div
        className="absolute inset-0 z-10 rounded-[inherit]"
        style={{ background: "var(--glass-bg)" }}
      />
      {/* specular inset rim (top-left light) */}
      <div
        className="absolute inset-0 z-20 rounded-[inherit]"
        style={{
          boxShadow:
            "inset 1.5px 1.5px 0.5px 0 var(--glass-edge), inset -1px -1px 1px 1px var(--glass-inner-shadow)",
        }}
      />
      <div
        className="absolute inset-0 z-20 rounded-[inherit]"
        style={{
          background:
            "radial-gradient(120% 80% at 15% 0%, var(--glass-highlight), transparent 55%)",
          opacity: 0.32,
        }}
      />
      <div className="relative z-30">{children}</div>
    </motion.div>
  );
});

type Variant = "primary" | "neutral";

const spring = {
  type: "spring",
  stiffness: 380,
  damping: 26,
  mass: 0.7,
} as const;

/** Liquid-glass button with spring hover/press. Champagne primary or neutral glass. */
export const GlassButton = forwardRef<
  HTMLButtonElement,
  HTMLMotionProps<"button"> & { variant?: Variant; fullWidth?: boolean }
>(function GlassButton(
  { children, className, variant = "primary", fullWidth, disabled, ...props },
  ref,
) {
  const reduced = useReducedMotion();
  return (
    <motion.button
      ref={ref}
      disabled={disabled}
      className={cn(
        "relative isolate inline-flex items-center justify-center gap-2 overflow-hidden rounded-full px-6 py-3 font-semibold",
        "disabled:pointer-events-none disabled:opacity-55",
        fullWidth && "w-full",
        variant === "primary"
          ? "text-[var(--btn-gold-text)]"
          : "text-[var(--text-strong)]",
        className,
      )}
      style={{ boxShadow: "var(--glass-shadow)" }}
      whileHover={reduced || disabled ? undefined : { y: -2, scale: 1.015 }}
      whileTap={reduced || disabled ? undefined : { scale: 0.96 }}
      transition={spring}
      {...props}
    >
      <span
        className="absolute inset-0 -z-10 rounded-full"
        style={{
          backdropFilter:
            "blur(var(--glass-blur)) saturate(var(--glass-saturate))",
          WebkitBackdropFilter:
            "blur(var(--glass-blur)) saturate(var(--glass-saturate))",
        }}
      />
      <span
        className="absolute inset-0 -z-10 rounded-full"
        style={{
          background:
            variant === "primary"
              ? "linear-gradient(to bottom, var(--glass-gold-hi), var(--glass-gold-lo)), var(--glass-bg)"
              : "var(--glass-bg)",
        }}
      />
      <span
        className="absolute inset-0 -z-10 rounded-full"
        style={{
          boxShadow:
            "inset 1.5px 1.5px 0.5px 0 var(--glass-edge), inset -1px -1px 1px 1px var(--glass-inner-shadow)",
        }}
      />
      {children as ReactNode}
    </motion.button>
  );
});
