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
      const r = anchor.getBoundingClientRect();
      const w = minWidth ?? r.width;
      // Width first, so the natural height we measure below is accurate.
      if (matchWidth) box.style.width = `${r.width}px`;
      else box.style.minWidth = `${w}px`;
      // Horizontal placement, clamped to the viewport.
      if (align === "end") {
        box.style.right = `${Math.max(8, window.innerWidth - r.right)}px`;
        box.style.left = "auto";
      } else {
        box.style.left = `${Math.max(8, Math.min(r.left, window.innerWidth - w - 8))}px`;
        box.style.right = "auto";
      }
      // Vertical placement with a flip: open upward when there isn't room below.
      const below = window.innerHeight - r.bottom - 16;
      const above = r.top - 16;
      const natural = Math.min(box.scrollHeight, window.innerHeight - 32);
      if (below < natural && above > below) {
        box.style.top = `${Math.max(8, r.top - Math.min(natural, above) - 8)}px`;
        box.style.maxHeight = `${Math.max(160, above)}px`;
      } else {
        box.style.top = `${r.bottom + 8}px`;
        box.style.maxHeight = `${Math.max(160, below)}px`;
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
      <div ref={boxRef} style={{ position: "fixed", zIndex: 1000, top: -9999 }} className="overflow-hidden">
        {children}
      </div>
    </>,
    document.body,
  );
}
