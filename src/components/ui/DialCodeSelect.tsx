"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Check, ChevronDown } from "lucide-react";
import { dialOptions, flagFor } from "@/lib/dial-codes";
import { cn } from "@/lib/utils";

/**
 * Compact, searchable dialling-code picker for the phone field — every country,
 * A–Z, names localized to the UI language. Shows the flag + code; type to filter
 * by country name or code. Reports the selected dial code (e.g. "+91").
 */
export function DialCodeSelect({
  value,
  onChange,
  locale = "en",
  disabled,
}: {
  value: string;
  onChange: (dial: string) => void;
  locale?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [iso, setIso] = useState("IN");
  const ref = useRef<HTMLDivElement>(null);

  const options = useMemo(() => dialOptions(locale), [locale]);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return options;
    return options.filter(
      (o) => o.name.toLowerCase().includes(s) || o.dial.includes(s) || o.iso.toLowerCase() === s,
    );
  }, [options, q]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Country dialling code"
        className="flex h-12 items-center gap-1.5 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3 text-[0.95rem] text-[var(--text-strong)] backdrop-blur-md transition-colors focus:border-[var(--focus-ring)] focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)]/25 disabled:opacity-55"
      >
        <span className="text-base leading-none">{flagFor(iso)}</span>
        <span className="tabular-nums">{value}</span>
        <ChevronDown className={cn("size-4 text-[var(--text-muted)] transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="glass glass-strong absolute z-50 mt-2 w-72 max-w-[80vw] overflow-hidden !rounded-2xl p-2">
          <div className="mb-2 flex items-center gap-2 rounded-xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3">
            <Search className="size-4 shrink-0 text-[var(--text-muted)]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search country or code…"
              autoFocus
              aria-label="Search country"
              className="h-10 flex-1 bg-transparent text-sm text-[var(--text-strong)] placeholder:text-[var(--text-muted)] focus:outline-none"
            />
          </div>
          <ul role="listbox" className="max-h-60 overflow-y-auto">
            {filtered.map((o) => {
              const active = o.iso === iso;
              return (
                <li key={o.iso}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => { setIso(o.iso); onChange(o.dial); setOpen(false); setQ(""); }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                      active ? "bg-[var(--glass-bg-strong)] text-[var(--text-strong)]" : "text-[var(--text-body)] hover:bg-[var(--glass-bg-soft)] hover:text-[var(--text-strong)]",
                    )}
                  >
                    <span className="text-base leading-none">{o.flag}</span>
                    <span className="flex-1 truncate">{o.name}</span>
                    <span className="text-[var(--text-muted)] tabular-nums">{o.dial}</span>
                    {active && <Check className="size-4 shrink-0 text-[var(--color-gold-500)]" />}
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-[var(--text-muted)]">No match.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
