import { forwardRef, useId, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, options, className, id, ...props },
  ref,
) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="mb-2 block text-sm font-medium text-[var(--text-body)]">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          className={cn(
            "h-12 w-full appearance-none rounded-2xl border bg-[var(--field-bg)] pl-4 pr-10",
            "text-[0.95rem] text-[var(--text-strong)] backdrop-blur-md transition-all",
            "border-[var(--field-border)] focus:border-[var(--focus-ring)]",
            "focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)]/25",
            error && "border-rose-400/70",
            className,
          )}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4.5 -translate-y-1/2 text-[var(--text-muted)]" />
      </div>
      {error && <p className="mt-1.5 text-sm text-rose-500">{error}</p>}
    </div>
  );
});
