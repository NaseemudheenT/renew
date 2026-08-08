"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

/**
 * Theme toggle. Both icons are always rendered; which one shows is driven
 * purely by the `[data-theme]` attribute on <html> (set before hydration by
 * the pre-paint script), so server and client markup always match — no
 * hydration mismatch, no flash. The cross-fade is CSS.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle color theme"
      className={cn(
        "theme-toggle relative grid size-10 place-items-center rounded-full",
        "text-[var(--muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--gold)]",
        className,
      )}
    >
      <Sun className="theme-icon theme-icon-sun size-5" />
      <Moon className="theme-icon theme-icon-moon size-5" />
    </button>
  );
}
