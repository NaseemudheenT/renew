"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { forwardRef, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Variant = "primary" | "glass" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface AnimatedButtonProps
  extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  children?: ReactNode;
}

const base =
  "relative inline-flex items-center justify-center gap-2 font-medium select-none " +
  "rounded-full whitespace-nowrap disabled:opacity-55 disabled:pointer-events-none " +
  "transition-[color,background,filter] duration-300 ease-[var(--ease-calm)]";

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-[0.95rem]",
  lg: "h-13 px-8 text-base",
};

const variants: Record<Variant, string> = {
  primary: "glass glass-primary !rounded-full font-semibold hover:brightness-[1.07]",
  glass: "glass !rounded-full text-[var(--text-strong)]",
  ghost:
    "text-[var(--text-body)] hover:text-[var(--text-strong)] hover:bg-[var(--glass-bg-soft)]",
  danger:
    "text-white bg-gradient-to-b from-rose-400 to-rose-600 " +
    "hover:from-rose-300 hover:to-rose-500 shadow-[0_6px_20px_rgba(200,60,80,0.28)]",
};

/** Liquid-glass button with physical press + hover. Reduced-motion aware. */
export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  function AnimatedButton(
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) {
    const reduced = useReducedMotion();
    // Match the supplied liquid-glass GlassButton press exactly so every button
    // across Renew shares the same physical click feel.
    const motionProps = reduced
      ? {}
      : {
          whileHover: { y: -2, scale: 1.015 },
          whileTap: { scale: 0.96 },
          transition: spring.snappy,
        };

    return (
      <motion.button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        className={cn(base, sizes[size], variants[variant], fullWidth && "w-full", className)}
        {...motionProps}
        {...props}
      >
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        <span className={cn(loading && "opacity-90")}>{children}</span>
      </motion.button>
    );
  },
);
