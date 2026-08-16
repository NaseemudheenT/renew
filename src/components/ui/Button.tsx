import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "glass" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const base =
  "relative inline-flex items-center justify-center gap-2 font-medium select-none " +
  "transition-all duration-300 ease-[var(--ease-calm)] disabled:opacity-55 " +
  "disabled:pointer-events-none active:scale-[0.985] rounded-full whitespace-nowrap";

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-[0.95rem]",
  lg: "h-13 px-8 text-base",
};

const variants: Record<ButtonVariant, string> = {
  // Champagne liquid-glass — the primary, meaningful action.
  primary:
    "glass glass-primary !rounded-full font-semibold " +
    "hover:brightness-[1.06] hover:-translate-y-[1px]",
  glass:
    "glass !rounded-full text-[var(--text-strong)] hover:brightness-[1.04] " +
    "hover:-translate-y-[1px]",
  ghost:
    "text-[var(--text-body)] hover:text-[var(--text-strong)] " +
    "hover:bg-[var(--glass-bg-soft)]",
  // Destructive stays solid for unmistakable, accessible signalling.
  danger:
    "text-white bg-gradient-to-b from-rose-400 to-rose-600 " +
    "hover:from-rose-300 hover:to-rose-500 shadow-[0_6px_20px_rgba(200,60,80,0.28)]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
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
    return (
      <button
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
        {...props}
      >
        {loading && (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        )}
        <span className={cn(loading && "opacity-90")}>{children}</span>
      </button>
    );
  },
);
