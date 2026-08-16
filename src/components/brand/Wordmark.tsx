import { cn } from "@/lib/utils";

export interface WordmarkProps {
  className?: string;
  /** Tailwind text-size class, e.g. "text-3xl". */
  sizeClassName?: string;
}

/**
 * The RENEW wordmark — light, wide-tracked uppercase in champagne gold,
 * matching the calm, premium feel of the mark.
 */
export function Wordmark({
  className,
  sizeClassName = "text-2xl",
}: WordmarkProps) {
  return (
    <span
      className={cn(
        "font-brand font-light uppercase leading-none",
        "bg-clip-text text-transparent",
        sizeClassName,
        className,
      )}
      style={{
        // Theme-aware champagne gradient: deeper in light (readable on ivory),
        // bright in dark. Never washed out.
        backgroundImage:
          "linear-gradient(180deg, var(--wordmark-from), var(--wordmark-to))",
        letterSpacing: "0.42em",
        paddingLeft: "0.42em",
      }}
    >
      Renew
    </span>
  );
}
