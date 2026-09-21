"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pencil, Trash2, ArrowDownLeft, ArrowUpRight, Copy } from "lucide-react";
import { RowMenu } from "@/components/ui/RowMenu";
import { SwipeRow } from "@/components/ui/SwipeRow";
import { useCategories } from "@/hooks/useCategories";
import { useLocale } from "@/components/providers/LocaleProvider";
import { catColor } from "@/lib/finance";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

export function TransactionRow({
  tx,
  onEdit,
  onDelete,
  onDuplicate,
}: {
  tx: Transaction;
  onEdit: () => void;
  onDelete: () => void;
  /** "Add again" — log the same thing in one tap (swipe right). */
  onDuplicate?: () => void;
}) {
  const { money, dueLabel, date } = useLocale();
  const { resolve } = useCategories();
  const [expanded, setExpanded] = useState(false);
  const meta = resolve(tx.category);
  const Icon = meta.icon;
  const income = tx.type === "income";
  const hue = catColor(meta);

  const menu = [
    { label: "Edit", icon: Pencil, onClick: onEdit },
    ...(onDuplicate ? [{ label: "Add again", icon: Copy, onClick: onDuplicate }] : []),
    { label: "Delete", icon: Trash2, onClick: onDelete, danger: true },
  ];

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
    >
      <SwipeRow
        swipeLeft={{ label: "Delete", icon: Trash2, bg: "bg-rose-500", onTrigger: onDelete }}
        swipeRight={onDuplicate ? { label: "Add again", icon: Copy, bg: "bg-emerald-500", onTrigger: onDuplicate } : undefined}
      >
        <div
          className={cn(
            "glass overflow-hidden p-3.5 transition-shadow",
            income ? "shadow-[inset_2px_0_0_rgba(16,185,129,0.7)]" : "shadow-[inset_2px_0_0_rgba(244,63,94,0.7)]",
          )}
          style={expanded ? { boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${hue} 40%, transparent), 0 0 26px -10px ${hue}` } : undefined}
        >
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} className="flex min-w-0 flex-1 items-center gap-3 text-left">
              <span
                className="grid size-10 shrink-0 place-items-center rounded-2xl"
                style={{
                  color: hue,
                  background: `color-mix(in srgb, ${hue} 15%, transparent)`,
                  boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${hue} 30%, transparent)`,
                }}
              >
                <Icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-strong truncate text-sm font-medium">{tx.note || meta.label}</div>
                <div className="text-muted mt-0.5 flex items-center gap-2 text-xs">
                  <span className="truncate">{meta.label}{tx.subcategory ? ` · ${tx.subcategory}` : ""}</span>
                  <span aria-hidden>·</span>
                  <span className="shrink-0">{dueLabel(tx.date)}</span>
                </div>
              </div>
              <div className={cn("flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums", income ? "text-emerald-500" : "text-rose-500")}>
                {income ? <ArrowDownLeft className="size-3.5" /> : <ArrowUpRight className="size-3.5" />}
                {income ? "+" : "−"}{money(tx.amount, tx.currency)}
              </div>
            </button>
            <RowMenu items={menu} />
          </div>

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div key="detail" layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                <div className="mt-3 border-t border-[var(--glass-border)] pt-3">
                  {tx.note && <p className="text-body mb-2 text-sm">{tx.note}</p>}
                  <div className="text-muted flex flex-wrap gap-x-2 gap-y-1 text-xs">
                    <span>{date(new Date(tx.date), { weekday: "short", day: "numeric", month: "long", year: "numeric" })}</span>
                    <span aria-hidden>·</span>
                    <span>{meta.label}{tx.subcategory ? ` › ${tx.subcategory}` : ""}</span>
                    <span aria-hidden>·</span>
                    <span className="capitalize">{tx.type}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--field-border)] bg-[var(--field-bg)] px-3 py-1.5 text-xs font-medium text-[var(--text-body)] hover:border-[var(--focus-ring)]/50"><Pencil className="size-3.5" />Edit</button>
                    {onDuplicate && <button type="button" onClick={onDuplicate} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--field-border)] bg-[var(--field-bg)] px-3 py-1.5 text-xs font-medium text-[var(--text-body)] hover:border-[var(--focus-ring)]/50"><Copy className="size-3.5" />Add again</button>}
                    <button type="button" onClick={onDelete} className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 px-3 py-1.5 text-xs font-medium text-rose-500 hover:bg-rose-500/10"><Trash2 className="size-3.5" />Delete</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SwipeRow>
    </motion.div>
  );
}
