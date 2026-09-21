import { forwardRef, useId, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, error, className, id, ...props }, ref) {
    const autoId = useId();
    const areaId = id ?? autoId;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={areaId} className="mb-2 block text-sm font-medium text-[var(--text-body)]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={areaId}
          rows={3}
          className={cn(
            "rn-field w-full resize-none rounded-2xl border bg-[var(--field-bg)] px-4 py-3",
            "text-[0.95rem] text-[var(--text-strong)] backdrop-blur-md",
            "placeholder:text-[var(--text-muted)] border-[var(--field-border)]",
            "focus:outline-none",
            error && "border-rose-400/70",
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-rose-500">{error}</p>}
      </div>
    );
  },
);
