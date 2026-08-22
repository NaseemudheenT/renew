"use client";

import { useLayoutEffect, useRef, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

/**
 * Renders floating menu content in a body-level portal, anchored under a trigger.
 * This escapes every parent stacking context (cards, forms and buttons that set
 * their own z-index), so a dropdown is ALWAYS fully above the page instead of
 * being painted through by later siblings. A transparent backdrop closes it on
 * outside click; Escape closes it too. Position is written imperatively (no
 * render-phase state) and kept in sync on scroll/resize.
 */
export function PopoverPortal({
  anchorRef,
  open,
  onClose,
  matchWidth = false,
  minWidth,
  align = "start",
  children,
}: {
  anchorRef: RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  /** Menu width = anchor width (for full-width fields). */
  matchWidth?: boolean;
  minWidth?: number;
  align?: "start" | "end";
  children: ReactNode;
}) {
  const boxRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const anchor = anchorRef.current;
    const box = boxRef.current;
    if (!anchor || !box) return;
    const place = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const gap = 8;
      const margin = 8;
      const r = anchor.getBoundingClientRect();

      // Width: match the trigger, but never so narrow that content is cramped;
      // and never wider than the viewport.
      const wanted = matchWidth ? Math.max(r.width, 232) : (minWidth ?? r.width);
      const width = Math.min(wanted, vw - margin * 2);
      box.style.width = `${width}px`;
      box.style.minWidth = "";

      // Horizontal — align to the trigger, clamped inside the viewport.
      if (align === "end") {
        const right = Math.max(margin, vw - r.right);
        box.style.right = `${Math.min(right, vw - width - margin)}px`;
        box.style.left = "auto";
      } else {
        box.style.left = `${Math.max(margin, Math.min(r.left, vw - width - margin))}px`;
        box.style.right = "auto";
      }

      // Vertical — a compact menu that opens downward by default and only flips
      // up when it genuinely fits better there, always hugging the trigger.
      const cap = Math.min(420, vh - margin * 2);
      const natural = Math.min(box.scrollHeight, cap);
      const below = vh - r.bottom - gap - margin;
      const above = r.top - gap - margin;
      const openUp = below < natural && above > below;
      if (openUp) {
        const h = Math.min(natural, above);
        box.style.top = `${Math.max(margin, r.top - gap - h)}px`;
        box.style.maxHeight = `${h}px`;
      } else {
        box.style.top = `${r.bottom + gap}px`;
        box.style.maxHeight = `${Math.max(160, Math.min(natural, below))}px`;
      }
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, anchorRef, onClose, matchWidth, minWidth, align]);

  if (typeof document === "undefined" || !open) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[999]" onMouseDown={onClose} aria-hidden="true" />
      <div ref={boxRef} style={{ position: "fixed", zIndex: 1000, top: -9999 }} className="flex flex-col overflow-hidden">
        {children}
      </div>
    </>,
    document.body,
  );
}
