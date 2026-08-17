import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type GlassVariant = "default" | "strong" | "soft";

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: GlassVariant;
  padded?: boolean;
}

const variantClass: Record<GlassVariant, string> = {
  default: "glass",
  strong: "glass glass-strong",
  soft: "glass glass-soft",
};

/** Liquid-glass surface: refractive edge, specular sheen, float shadow. */
export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  function GlassCard({ variant = "default", padded = false, className, children, ...props }, ref) {
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
