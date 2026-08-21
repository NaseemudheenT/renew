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

/** A list of shimmer rows — the standard loading state for Renew's list screens. */
export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-2xl" />
      ))}
    </div>
  );
}
