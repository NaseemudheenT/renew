"use client";

import { AnimatedModal } from "@/components/motion";
import { ChevronRight, type LucideIcon } from "lucide-react";

export interface AddOption {
  icon: LucideIcon;
  title: string;
  sub: string;
  onClick: () => void;
}

/**
 * The "+" entry list — every way to add something, in one clean list (never all
 * open at once). Shared across features (transactions, income, budgets, …); each
 * feature passes the options that make sense for it. One clear choice per row.
 */
export function AddMenu({
  open,
  onClose,
  title = "Add",
  options,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  options: AddOption[];
}) {
  return (
    <AnimatedModal open={open} onClose={onClose} title={title}>
      <div className="glass flex flex-col divide-y divide-[var(--glass-border)] overflow-hidden !p-0">
        {options.map((o) => {
          const Icon = o.icon;
          return (
            <button
              key={o.title}
              type="button"
              onClick={() => { onClose(); o.onClick(); }}
              className="flex items-center gap-4 p-4 text-left transition-colors hover:bg-[var(--glass-bg-soft)]"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--glass-bg-soft)]">
                <Icon className="size-5 text-[var(--color-gold-500)]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-strong block text-sm font-medium">{o.title}</span>
                <span className="text-muted block truncate text-xs">{o.sub}</span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-[var(--text-muted)]" />
            </button>
          );
        })}
      </div>
    </AnimatedModal>
  );
}
