"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { Search, Check, ChevronDown } from "lucide-react";
import { PopoverPortal } from "@/components/ui/PopoverPortal";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  /** Small leading node — a flag emoji or a symbol chip. */
  leading?: ReactNode;
  /** Main label. */
  primary: string;
  /** Muted sub-label under the primary. */
  secondary?: string;
  /** Right-aligned code (e.g. "USD", "IN", "+91"). */
  trailing?: string;
  /** Extra text to match against when searching. */
  search?: string;
}

/**
 * One consistent, structured, quality picker for language / country / currency
 * (and anything list-like): a clean trigger, a portalled menu that's always on
 * top, a real search box, and evenly-structured rows (leading · primary +
 * secondary · trailing code · check). Every such control across Renew shares
 * this, so they look and behave identically.
 */
export function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  showTriggerLeading = false,
  emptyText = "No match.",
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  showTriggerLeading?: boolean;
  emptyText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const anchorRef = useRef<HTMLButtonElement>(null);

  const current = options.find((o) => o.value === value);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return options;
    return options.filter(
      (o) =>
        o.primary.toLowerCase().includes(s) ||
        (o.secondary?.toLowerCase().includes(s) ?? false) ||
        (o.trailing?.toLowerCase().includes(s) ?? false) ||
        (o.search?.toLowerCase().includes(s) ?? false) ||
        o.value.toLowerCase() === s,
    );
  }, [options, q]);

  function close() {
    setOpen(false);
    setQ("");
  }

  return (
    <div className="w-full">
      {label && (
        <label className="mb-2 block text-sm font-medium text-[var(--text-body)]">{label}</label>
      )}
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-12 w-full items-center gap-2.5 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 text-[0.95rem] text-[var(--text-strong)] backdrop-blur-md transition-colors focus:border-[var(--focus-ring)] focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)]/25"
      >
        {showTriggerLeading && current?.leading && <span className="shrink-0 text-base leading-none">{current.leading}</span>}
        <span className="min-w-0 flex-1 truncate text-start">{current ? current.primary : placeholder}</span>
        {current?.trailing && <span className="text-muted shrink-0 text-sm tabular-nums">{current.trailing}</span>}
        <ChevronDown className={cn("size-4.5 shrink-0 text-[var(--text-muted)] transition-transform", open && "rotate-180")} />
      </button>

      <PopoverPortal anchorRef={anchorRef} open={open} onClose={close} matchWidth>
        <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-[var(--menu-border)] bg-[var(--menu-bg)] p-2 shadow-[var(--glass-shadow)] backdrop-blur-xl">
          <div className="mb-2 flex items-center gap-2 rounded-xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3">
            <Search className="size-4 shrink-0 text-[var(--text-muted)]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={searchPlaceholder}
              autoFocus
              aria-label={searchPlaceholder}
              className="h-10 flex-1 bg-transparent text-sm text-[var(--text-strong)] placeholder:text-[var(--text-muted)] focus:outline-none"
            />
          </div>
          <ul role="listbox" className="min-h-0 flex-1 overflow-y-auto">
            {filtered.map((o) => {
              const active = o.value === value;
              return (
                <li key={o.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => { onChange(o.value); close(); }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                      active ? "bg-[var(--glass-bg-strong)] text-[var(--text-strong)]" : "text-[var(--text-body)] hover:bg-[var(--glass-bg-soft)] hover:text-[var(--text-strong)]",
                    )}
                  >
                    {o.leading && <span className="grid size-7 shrink-0 place-items-center text-base leading-none">{o.leading}</span>}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-[var(--text-strong)]">{o.primary}</span>
                      {o.secondary && o.secondary !== o.primary && (
                        <span className="text-muted block truncate text-xs">{o.secondary}</span>
                      )}
                    </span>
                    {o.trailing && <span className="text-muted shrink-0 text-xs tabular-nums">{o.trailing}</span>}
                    {active && <Check className="size-4 shrink-0 text-[var(--color-gold-500)]" />}
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-[var(--text-muted)]">{emptyText}</li>
            )}
          </ul>
        </div>
      </PopoverPortal>
    </div>
  );
}
