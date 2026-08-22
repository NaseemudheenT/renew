"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Check, ChevronDown } from "lucide-react";
import { languageOptions } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

/**
 * A global, searchable language picker — every language, A–Z, each shown by its
 * own endonym plus the name in the current UI language. Type to filter by either
 * name or code. Mirrors CountrySelect so the whole product feels of one piece.
 */
export function LanguageSelect({
  label,
  value,
  onChange,
  locale = "en",
}: {
  label?: string;
  value: string;
  onChange: (code: string) => void;
  locale?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const options = useMemo(() => languageOptions(locale), [locale]);
  const current = options.find((o) => o.code === value);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return options;
    return options.filter(
      (o) =>
        o.native.toLowerCase().includes(s) ||
        o.label.toLowerCase().includes(s) ||
        o.code.toLowerCase() === s,
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
    <div className="w-full" ref={ref}>
      {label && (
        <label className="mb-2 block text-sm font-medium text-[var(--text-body)]">{label}</label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex h-12 w-full items-center justify-between rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 text-[0.95rem] text-[var(--text-strong)] backdrop-blur-md transition-colors focus:border-[var(--focus-ring)] focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)]/25"
        >
          <span className="truncate">
            {current ? `${current.native} · ${current.label}` : "Select language"}
          </span>
          <ChevronDown className={cn("size-4.5 shrink-0 text-[var(--text-muted)] transition-transform", open && "rotate-180")} />
        </button>

        {open && (
          <div className="glass glass-strong absolute z-50 mt-2 w-full overflow-hidden !rounded-2xl p-2">
            <div className="mb-2 flex items-center gap-2 rounded-xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3">
              <Search className="size-4 shrink-0 text-[var(--text-muted)]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search language…"
                autoFocus
                aria-label="Search language"
                className="h-10 flex-1 bg-transparent text-sm text-[var(--text-strong)] placeholder:text-[var(--text-muted)] focus:outline-none"
              />
            </div>
            <ul role="listbox" className="max-h-60 overflow-y-auto">
              {filtered.map((o) => {
                const active = o.code === value;
                return (
                  <li key={o.code}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      dir={o.dir}
                      onClick={() => { onChange(o.code); setOpen(false); setQ(""); }}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                        active ? "bg-[var(--glass-bg-strong)] text-[var(--text-strong)]" : "text-[var(--text-body)] hover:bg-[var(--glass-bg-soft)] hover:text-[var(--text-strong)]",
                      )}
                    >
                      <span className="truncate">
                        <span className="font-medium text-[var(--text-strong)]">{o.native}</span>
                        {o.native !== o.label && <span className="text-[var(--text-muted)]"> · {o.label}</span>}
                      </span>
                      {active && <Check className="size-4 shrink-0 text-[var(--color-gold-500)]" />}
                    </button>
                  </li>
                );
              })}
              {filtered.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-[var(--text-muted)]">No language matches “{q}”.</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
