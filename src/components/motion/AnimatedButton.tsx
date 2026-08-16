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
  "transition-colors duration-300 ease-[var(--ease-calm)] focus-visible:outline-2";

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-[0.95rem]",
  lg: "h-13 px-8 text-base",
};

const variants: Record<Variant, string> = {
  primary:
    "text-[var(--text-onGold)] shadow-[0_6px_20px_rgba(160,120,50,0.28)] " +
    "bg-gradient-to-b from-gold-200 to-gold-400 hover:from-gold-100 hover:to-gold-300",
  glass: "glass !rounded-full text-[var(--text-strong)]",
  ghost:
    "text-[var(--text-body)] hover:text-[var(--text-strong)] hover:bg-[var(--glass-bg-soft)]",
  danger:
    "text-white bg-gradient-to-b from-rose-400 to-rose-600 " +
    "hover:from-rose-300 hover:to-rose-500 shadow-[0_6px_20px_rgba(200,60,80,0.28)]",
};

/**
 * Button with physical press + hover motion. Falls back to no transform under
 * reduced motion. For non-animated needs use the plain <Button> primitive.
 */
export const AnimatedButton = forwardRef<
  HTMLButtonElement,
  AnimatedButtonProps
>(function AnimatedButton(
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
  const motionProps = reduced
    ? {}
    : {
        whileHover: { y: -2 },
        whileTap: { scale: 0.97 },
        transition: spring.snappy,
      };

  return (
    <motion.button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading}
      className={cn(
        base,
        sizes[size],
        variants[variant],
        fullWidth && "w-full",
        className,
      )}
      {...motionProps}
      {...props}
    >
      {loading && (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      )}
      <span className={cn(loading && "opacity-90")}>{children}</span>
    </motion.button>
  );
});
