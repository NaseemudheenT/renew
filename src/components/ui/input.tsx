"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, error, icon: Icon, type = "text", id, ...props },
  ref,
) {
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (reveal ? "text" : "password") : type;
  const inputId = id || props.name;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-2 block text-xs font-medium tracking-wide text-[var(--muted)]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-[var(--subtle)]" />
        )}
        <input
          ref={ref}
          id={inputId}
          type={inputType}
          aria-invalid={!!error}
          className={cn(
            "h-12 w-full rounded-[var(--radius-md)] bg-[var(--surface)] text-[15px] text-[var(--foreground)]",
            "border border-[var(--border)] placeholder:text-[var(--subtle)]",
            "transition-colors duration-200 outline-none",
            "focus:border-[var(--gold)] focus:ring-2 focus:ring-[color-mix(in_oklab,var(--gold)_25%,transparent)]",
            Icon ? "pl-11" : "pl-4",
            isPassword ? "pr-11" : "pr-4",
            error && "border-[var(--danger)] focus:border-[var(--danger)] focus:ring-0",
            className,
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-3 grid size-8 -translate-y-1/2 place-items-center rounded-md text-[var(--subtle)] transition-colors hover:text-[var(--foreground)]"
          >
            {reveal ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
});
