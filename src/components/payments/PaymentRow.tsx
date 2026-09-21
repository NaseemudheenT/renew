"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pencil, Trash2, RotateCcw, Repeat, Check } from "lucide-react";
import { AnimatedButton } from "@/components/motion";
import { RowMenu } from "@/components/ui/RowMenu";
import { SwipeRow } from "@/components/ui/SwipeRow";
import { categoryMeta } from "@/lib/categories";
import { isOverdue } from "@/lib/dates";
import { useLocale } from "@/components/providers/LocaleProvider";
import { cn } from "@/lib/utils";
import type { Payment } from "@/lib/types";

export function PaymentRow({
  payment,
  onPay,
  onUnpay,
  onEdit,
  onDelete,
}: {
  payment: Payment;
  onPay: () => Promise<void>;
  onUnpay: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { money, dueLabel, date } = useLocale();
  const [expanded, setExpanded] = useState(false);
  const meta = categoryMeta(payment.category);
  const Icon = meta.icon;
  const paid = payment.status === "paid";
  const overdue = !paid && isOverdue(payment.dueAt);
  const repeatLabel = payment.repeat !== "none" ? payment.repeat : null;

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
    >
      <SwipeRow
        swipeRight={paid ? undefined : { label: "Paid", icon: Check, bg: "bg-emerald-500", onTrigger: () => { void onPay(); } }}
        swipeLeft={{ label: "Delete", icon: Trash2, bg: "bg-rose-500", onTrigger: onDelete }}
      >
        <div className={cn("glass overflow-hidden p-3.5 sm:gap-4", expanded && "ring-1 ring-[var(--color-gold-500)]/30")}>
          <div className="flex items-center gap-3 sm:gap-4">
            <button type="button" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} className="flex min-w-0 flex-1 items-center gap-3 text-left sm:gap-4">
              <span className="glass grid size-10 shrink-0 place-items-center !rounded-2xl"><Icon className="size-5 text-[var(--color-gold-500)]" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn("truncate text-sm font-medium", paid ? "text-[var(--text-muted)]" : "text-[var(--text-strong)]")}>{payment.name}</span>
                  {payment.repeat !== "none" && <Repeat className="size-3.5 shrink-0 text-[var(--text-muted)]" />}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs">
                  <span className="text-strong font-medium tabular-nums">{money(payment.amount, payment.currency)}</span>
                  <span className={cn(overdue ? "text-rose-500" : "text-[var(--text-muted)]")}>{paid ? "Paid" : dueLabel(payment.dueAt)}</span>
                </div>
              </div>
            </button>
            {!paid && <AnimatedButton size="sm" onClick={() => void onPay()}><Check className="size-4" />Mark paid</AnimatedButton>}
            <RowMenu
              items={
                paid
                  ? [
                      { label: "Mark unpaid", icon: RotateCcw, onClick: onUnpay },
                      { label: "Edit", icon: Pencil, onClick: onEdit },
                      { label: "Delete", icon: Trash2, onClick: onDelete, danger: true },
                    ]
                  : [
                      { label: "Edit", icon: Pencil, onClick: onEdit },
                      { label: "Delete", icon: Trash2, onClick: onDelete, danger: true },
                    ]
              }
            />
          </div>

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div key="detail" layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                <div className="mt-3 border-t border-[var(--glass-border)] pt-3 text-xs">
                  <div className="text-muted flex flex-wrap gap-x-2 gap-y-1">
                    <span>{paid && payment.paidAt ? `Paid ${date(new Date(payment.paidAt), { day: "numeric", month: "long", year: "numeric" })}` : `Due ${date(new Date(payment.dueAt), { weekday: "short", day: "numeric", month: "long", year: "numeric" })}`}</span>
                    <span aria-hidden>·</span>
                    <span>{meta.label}</span>
                    {repeatLabel && <><span aria-hidden>·</span><span className="capitalize">{repeatLabel}</span></>}
                    {payment.method && <><span aria-hidden>·</span><span className="capitalize">{payment.method}</span></>}
                  </div>
                  {payment.notes && <p className="text-body mt-2">{payment.notes}</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SwipeRow>
    </motion.div>
  );
}
