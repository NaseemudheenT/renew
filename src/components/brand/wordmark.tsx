import { cn } from "@/lib/utils";

interface WordmarkProps {
  className?: string;
  /** Use the gold gradient treatment (default) or plain foreground. */
  gold?: boolean;
  as?: "h1" | "span" | "div";
}

/**
 * The RENEW wordmark — wide, quiet letter-spacing in the display face.
 */
export function Wordmark({ className, gold = true, as: Tag = "span" }: WordmarkProps) {
  return (
    <Tag
      className={cn(
        "font-display font-light tracking-[0.42em] uppercase",
        gold ? "text-gradient-gold" : "text-[var(--foreground)]",
        className,
      )}
    >
      Renew
    </Tag>
  );
}
