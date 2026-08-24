"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The one search box used across Renew — small, pill-shaped and glassy, with a
 * clear button that appears once you type. Keep it compact: don't stretch it to
 * full width unless a page genuinely needs it.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  ariaLabel,
  className,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full border border-[var(--field-border)] bg-[var(--field-bg)] ps-3.5 pe-2 transition-colors focus-within:border-[var(--focus-ring)]",
        className,
      )}
    >
      <Search className="size-4 shrink-0 text-[var(--text-muted)]" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        autoFocus={autoFocus}
        className="h-full min-w-0 flex-1 bg-transparent text-sm text-[var(--text-strong)] placeholder:text-[var(--text-muted)] focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="grid size-6 shrink-0 place-items-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--glass-bg-strong)] hover:text-[var(--text-strong)]"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
