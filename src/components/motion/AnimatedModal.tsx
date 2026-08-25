"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { modalVariants, sheetVariants, backdropVariants } from "@/lib/motion";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

export interface AnimatedModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
  hideClose?: boolean;
  dismissible?: boolean;
}

/** Accessible, focus-trapped liquid-glass dialog rendered in a portal. */
export function AnimatedModal({
  open,
  onClose,
  children,
  title,
  description,
  className,
  hideClose = false,
  dismissible = true,
}: AnimatedModalProps) {
  const reduced = useReducedMotion();
  const isMobile = useIsMobile();
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  const labelId = useId();
  const descId = useId();

  const close = useCallback(() => {
    if (dismissible) onClose();
  }, [dismissible, onClose]);

  useEffect(() => {
    if (!open) return;
    lastFocused.current = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const raf = requestAnimationFrame(() => {
      const focusable = panelRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      (focusable ?? panelRef.current)?.focus();
    });
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prev;
      lastFocused.current?.focus?.();
    };
  }, [open]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0]!;
      const last = nodes[nodes.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [close],
  );

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? labelId : undefined}
          aria-describedby={description ? descId : undefined}
          onKeyDown={onKeyDown}
        >
          <motion.div
            className="absolute inset-0 bg-[rgba(8,6,3,0.5)] backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            onClick={close}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            className={cn(
              // Native bottom sheet on phones (rounded top, safe-area), centred dialog on desktop.
              "glass glass-strong relative z-10 w-full max-h-[92dvh] overflow-y-auto outline-none",
              "!rounded-b-none !rounded-t-[1.75rem] px-5 pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] pt-3",
              "sm:max-w-lg sm:!rounded-glass sm:p-8 sm:max-h-[85dvh]",
              className,
            )}
            variants={reduced ? backdropVariants : isMobile ? sheetVariants : modalVariants}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            {/* Grab handle — the native-sheet affordance (mobile only). */}
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[var(--text-muted)]/30 sm:hidden" aria-hidden="true" />
            {!hideClose && dismissible && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="absolute end-4 top-4 grid size-9 place-items-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--glass-bg-soft)] hover:text-[var(--text-strong)]"
              >
                <X className="size-4.5" />
              </button>
            )}
            {title && (
              <h2 id={labelId} className="text-strong pe-8 text-lg font-medium">
                {title}
              </h2>
            )}
            {description && (
              <p id={descId} className="text-muted mt-1 text-sm">
                {description}
              </p>
            )}
            <div className={cn((title || description) && "mt-5")}>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
