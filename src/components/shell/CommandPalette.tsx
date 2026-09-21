"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Plus, ScanLine, Sparkles, CornerDownLeft, type LucideIcon } from "lucide-react";
import { navItemsFor } from "@/lib/nav";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { openRen } from "@/lib/ren-open";
import { COMMAND_OPEN_EVENT } from "@/lib/command-open";
import { cn } from "@/lib/utils";

interface Cmd {
  id: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  run: () => void;
  keywords?: string;
}

/**
 * The OS command palette (design system §4). ⌘K / Ctrl+K anywhere, or the
 * top-bar search pill, opens it: type to jump to any screen, add an expense,
 * scan a receipt, or ask Ren — without leaving the screen you're on.
 */
export function CommandPalette() {
  const router = useRouter();
  const { mode } = useWorkspace();
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

  // ⌘K / Ctrl+K toggles; the search pill dispatches COMMAND_OPEN_EVENT.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((v) => !v); }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(COMMAND_OPEN_EVENT, onOpen);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener(COMMAND_OPEN_EVENT, onOpen); };
  }, []);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQ(""); setSel(0);
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  const commands = useMemo<Cmd[]>(() => {
    const nav = navItemsFor(mode).map((n) => ({
      id: `nav:${n.href}`, label: t(n.msgKey), hint: "Go to", icon: n.icon as unknown as LucideIcon,
      run: () => router.push(n.href), keywords: n.label,
    }));
    return [
      { id: "add", label: "Add expense or income", hint: "Quick add", icon: Plus, run: () => router.push("/quick-add"), keywords: "new create log spend" },
      { id: "scan", label: "Scan a receipt", hint: "Camera", icon: ScanLine, run: () => router.push("/import?scan=1"), keywords: "bill photo ocr" },
      { id: "ren", label: "Ask Ren", hint: "Assistant", icon: Sparkles, run: () => openRen(), keywords: "ai assistant help chat speak" },
      ...nav,
    ];
  }, [mode, router, t]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return commands;
    return commands.filter((c) => (c.label + " " + (c.keywords ?? "")).toLowerCase().includes(s));
  }, [q, commands]);

  const clampedSel = Math.min(sel, Math.max(0, filtered.length - 1));

  function run(c: Cmd | undefined) {
    if (!c) return;
    setOpen(false);
    c.run();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); run(filtered[clampedSel]); }
    else if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[130] flex items-start justify-center px-4 pt-[14vh]"
          style={{ background: "color-mix(in oklab, var(--bg-base) 70%, transparent)", backdropFilter: "blur(16px)" }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
          role="dialog" aria-modal="true" aria-label="Command palette"
        >
          <motion.div
            className="glass w-full max-w-lg overflow-hidden !rounded-2xl"
            initial={{ opacity: 0, y: -12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-[var(--glass-border)] px-4">
              <Search className="size-4.5 shrink-0 text-[var(--color-gold-500)]" />
              <input
                ref={inputRef} value={q}
                onChange={(e) => { setQ(e.target.value); setSel(0); }}
                onKeyDown={onKeyDown}
                placeholder="Search, add an expense, or ask Ren…"
                aria-label="Command palette search"
                className="h-13 min-w-0 flex-1 bg-transparent py-3.5 text-sm text-[var(--text-strong)] outline-none placeholder:text-[var(--text-muted)]"
              />
              <kbd className="text-muted hidden shrink-0 rounded-md border border-[var(--glass-border)] px-1.5 py-0.5 text-[10px] sm:block">esc</kbd>
            </div>
            <ul className="max-h-[52vh] overflow-y-auto overscroll-contain p-2">
              {filtered.length === 0 ? (
                <li className="text-muted px-3 py-6 text-center text-sm">No matches. Try “Budgets” or “Add”.</li>
              ) : filtered.map((c, i) => {
                const Icon = c.icon;
                const on = i === clampedSel;
                return (
                  <li key={c.id}>
                    <button type="button" onClick={() => run(c)} onMouseMove={() => setSel(i)}
                      className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors", on ? "bg-[var(--glass-bg-strong)]" : "hover:bg-[var(--glass-bg-soft)]")}>
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--glass-bg-strong)] text-[var(--color-gold-500)]"><Icon className="size-4.5" /></span>
                      <span className="text-body min-w-0 flex-1 truncate text-sm">{c.label}</span>
                      <span className="text-muted shrink-0 text-xs">{c.hint}</span>
                      {on && <CornerDownLeft className="size-3.5 shrink-0 text-[var(--text-muted)]" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
