"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { Sparkles, Gem, Palette, Bot, Zap, ArrowRight, type LucideIcon } from "lucide-react";
import { RenewMark } from "@/components/brand/RenewMark";
import { APP_UPDATE_KEY, APP_UPDATE_NAME, WHATS_NEW } from "@/lib/setup-version";

const STORAGE_KEY = "renew-whatsnew";
const ICONS: Record<string, LucideIcon> = { Sparkles, Gem, Palette, Bot, Zap };
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The Apple-style "What's new" reveal — shown ONCE to every user on their first
 * open after an update, so nobody misses what changed. A premium bottom sheet:
 * the gold mark, the release name, a short list of highlights, and one button.
 * Swipe it down (or tap Got it) to dismiss; it never shows again for this
 * release. Purely local (localStorage), no network, hydration-safe (nothing
 * renders until after mount).
 */
export function WhatsNew() {
  const [open, setOpen] = useState(false);
  const drag = useDragControls();

  useEffect(() => {
    let seen: string | null = null;
    try { seen = localStorage.getItem(STORAGE_KEY); } catch { /* private mode */ }
    if (seen === APP_UPDATE_KEY) return;
    // Let the app settle first, then reveal.
    const t = setTimeout(() => setOpen(true), 900);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, APP_UPDATE_KEY); } catch { /* ignore */ }
    setOpen(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-[120] bg-black/55 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={dismiss} aria-hidden />
          <motion.div
            role="dialog" aria-label={`What's new in Renew ${APP_UPDATE_NAME}`}
            className="glass glass-veil fixed inset-x-0 bottom-0 z-[121] mx-auto flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden !rounded-b-none !rounded-t-[2rem] px-6 pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] pt-3"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 34 }}
            drag="y" dragControls={drag} dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_e, info) => { if (info.offset.y > 120 || info.velocity.y > 600) dismiss(); }}
          >
            {/* Grab handle — swipe down to dismiss. */}
            <div className="mx-auto mt-1 h-1.5 w-11 shrink-0 cursor-grab touch-none rounded-full bg-[var(--text-muted)]/30" onPointerDown={(e) => drag.start(e)} aria-hidden />

            <div className="mt-4 flex flex-col items-center text-center">
              <RenewMark size={52} idSuffix="whatsnew" />
              <h2 className="text-strong mt-4 text-xl font-medium tracking-tight">What&apos;s new</h2>
              <p className="text-muted mt-1 text-sm">Renew · {APP_UPDATE_NAME}</p>
            </div>

            <ul className="mt-6 flex flex-col gap-3 overflow-y-auto overscroll-contain pb-2">
              {WHATS_NEW.map((h, i) => {
                const Icon = ICONS[h.icon] ?? Sparkles;
                return (
                  <motion.li key={h.title} className="flex items-start gap-3.5"
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.08, duration: 0.5, ease: EASE }}>
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl" style={{ color: "var(--color-gold-500)", background: "color-mix(in srgb, var(--color-gold-500) 14%, transparent)", boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--color-gold-500) 28%, transparent)" }}>
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-strong text-sm font-medium">{h.title}</p>
                      <p className="text-muted mt-0.5 text-xs leading-relaxed">{h.desc}</p>
                    </div>
                  </motion.li>
                );
              })}
            </ul>

            <button type="button" onClick={dismiss}
              className="glass-primary mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full font-semibold">
              Start exploring <ArrowRight className="size-4" />
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
