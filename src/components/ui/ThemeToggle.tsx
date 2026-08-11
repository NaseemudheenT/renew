"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        "glass !rounded-full grid size-11 place-items-center",
        "text-[var(--text-body)] transition-all duration-500 ease-[var(--ease-calm)]",
        "hover:text-[var(--text-strong)] hover:-translate-y-[1px]",
        className,
      )}
    >
      <Sun
        className={cn(
          "size-5 transition-all duration-500 ease-[var(--ease-calm)]",
          isDark ? "scale-0 opacity-0 rotate-90 absolute" : "scale-100 opacity-100",
        )}
      />
      <Moon
        className={cn(
          "size-5 transition-all duration-500 ease-[var(--ease-calm)]",
          isDark ? "scale-100 opacity-100" : "scale-0 opacity-0 -rotate-90 absolute",
        )}
      />
    </button>
  );
}
