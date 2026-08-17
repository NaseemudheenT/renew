"use client";

import { motion } from "framer-motion";
import { Pencil, Trash2, RotateCcw, Repeat } from "lucide-react";
import { PayButton } from "./PayButton";
import { RowMenu } from "@/components/ui/RowMenu";
import { categoryMeta } from "@/lib/categories";
import { dueLabel, isOverdue } from "@/lib/dates";
import { formatMoney, cn } from "@/lib/utils";
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
  const meta = categoryMeta(payment.category);
  const Icon = meta.icon;
  const paid = payment.status === "paid";
  const overdue = !paid && isOverdue(payment.dueAt);

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className="glass flex items-center gap-3 p-3.5 sm:gap-4"
    >
      <span className="glass grid size-10 shrink-0 place-items-center !rounded-2xl"><Icon className="size-5 text-[var(--color-gold-500)]" /></span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn("truncate text-sm font-medium", paid ? "text-[var(--text-muted)]" : "text-[var(--text-strong)]")}>{payment.name}</span>
          {payment.repeat !== "none" && <Repeat className="size-3.5 shrink-0 text-[var(--text-muted)]" />}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs">
          <span className="text-strong font-medium tabular-nums">{formatMoney(payment.amount, payment.currency)}</span>
          <span className={cn(overdue ? "text-rose-500" : "text-[var(--text-muted)]")}>{paid ? "Paid" : dueLabel(payment.dueAt)}</span>
        </div>
      </div>
      {!paid && <PayButton onPay={onPay} size="sm" />}
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
    </motion.div>
  );
}
