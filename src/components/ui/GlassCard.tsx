import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type GlassVariant = "default" | "strong" | "soft";

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: GlassVariant;
  /** Add generous interior padding. */
  padded?: boolean;
}

const variantClass: Record<GlassVariant, string> = {
  default: "glass",
  strong: "glass glass-strong",
  soft: "glass glass-soft",
};

/**
 * Floating liquid-glass surface: translucency + backdrop blur/saturation,
 * a bright top highlight edge, and a soft realistic float shadow.
 */
export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  function GlassCard(
    { variant = "default", padded = false, className, children, ...props },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cn(variantClass[variant], padded && "p-6 sm:p-8", className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);
