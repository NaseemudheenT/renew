"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-[var(--gold)] text-[var(--gold-contrast)] hover:bg-[var(--gold-bright)] shadow-[0_8px_30px_-8px_color-mix(in_oklab,var(--gold)_60%,transparent)]",
  secondary:
    "bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--surface-hover)]",
  ghost: "bg-transparent text-[var(--foreground)] hover:bg-[var(--surface-hover)]",
  outline:
    "bg-transparent text-[var(--foreground)] border border-[var(--border-strong)] hover:border-[var(--gold)] hover:text-[var(--gold)]",
  danger: "bg-[var(--danger)] text-white hover:opacity-90",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-4 text-sm rounded-[var(--radius-sm)]",
  md: "h-11 px-6 text-sm rounded-[var(--radius-md)]",
  lg: "h-14 px-8 text-base rounded-[var(--radius-lg)]",
};

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref" | "children"> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, fullWidth, disabled, children, ...props },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium tracking-wide",
        "transition-colors duration-200 outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </motion.button>
  );
});
