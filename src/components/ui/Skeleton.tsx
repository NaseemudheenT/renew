import { cn } from "@/lib/utils";

/**
 * A calm shimmer placeholder — premium loading, never a blank flash or a
 * flash of zeros. Purely presentational; respects reduced motion (the global
 * reduced-motion rule stills the sweep). Locale-agnostic, so it's identical in
 * every country.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden rounded-xl bg-[var(--glass-bg-soft)]",
        className,
      )}
    >
      <span className="skeleton-sweep absolute inset-0" />
    </div>
  );
}
