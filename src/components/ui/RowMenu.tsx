"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { MoreVertical, type LucideIcon } from "lucide-react";
import { PopoverPortal } from "@/components/ui/PopoverPortal";
import { cn } from "@/lib/utils";

export interface RowMenuItem {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  danger?: boolean;
}

export function RowMenu({ items, label = "More actions" }: { items: RowMenuItem[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className="grid size-8 place-items-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--glass-bg-soft)] hover:text-[var(--text-strong)]"
      >
        <MoreVertical className="size-4.5" />
      </button>

      <PopoverPortal anchorRef={anchorRef} open={open} onClose={() => setOpen(false)} minWidth={160} align="end">
        <motion.div
          role="menu"
          initial={{ opacity: 0, y: -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.14 }}
          className="w-40 overflow-hidden rounded-xl border border-[var(--menu-border)] bg-[var(--menu-bg)] p-1 shadow-[var(--glass-shadow)] backdrop-blur-xl"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                item.danger
                  ? "text-rose-600 hover:bg-rose-500/10 dark:text-rose-300"
                  : "text-[var(--text-body)] hover:bg-[var(--glass-bg-soft)] hover:text-[var(--text-strong)]",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </button>
          ))}
        </motion.div>
      </PopoverPortal>
    </>
  );
}
