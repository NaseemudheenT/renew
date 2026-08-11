import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
}

/** Glassy but perfectly legible text field with floating-label affordance. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, icon, className, id, type = "text", ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword ? (show ? "text" : "password") : type;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-2 block text-sm font-medium text-[var(--text-body)]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          type={resolvedType}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            error
              ? `${inputId}-error`
              : hint
                ? `${inputId}-hint`
                : undefined
          }
          className={cn(
            "h-12 w-full rounded-2xl border bg-[var(--field-bg)] text-[var(--text-strong)]",
            "backdrop-blur-md placeholder:text-[var(--text-muted)]",
            "px-4 text-[0.95rem] transition-all duration-300 ease-[var(--ease-calm)]",
            "border-[var(--field-border)] focus:border-[var(--focus-ring)]",
            "focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)]/25",
            icon && "pl-11",
            isPassword && "pr-11",
            error && "border-rose-400/70 focus:ring-rose-400/20",
            className,
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-[var(--text-muted)] hover:text-[var(--text-strong)]"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? (
              <EyeOff className="size-4.5" />
            ) : (
              <Eye className="size-4.5" />
            )}
          </button>
        )}
      </div>
      {error ? (
        <p
          id={`${inputId}-error`}
          className="mt-1.5 text-sm text-rose-500"
          role="alert"
        >
          {error}
        </p>
      ) : hint ? (
        <p
          id={`${inputId}-hint`}
          className="mt-1.5 text-sm text-[var(--text-muted)]"
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
});
