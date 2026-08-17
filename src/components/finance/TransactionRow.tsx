"use client";

import { motion } from "framer-motion";
import { Pencil, Trash2, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { RowMenu } from "@/components/ui/RowMenu";
import { catMeta } from "@/lib/finance";
import { useLocale } from "@/components/providers/LocaleProvider";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

export function TransactionRow({
  tx,
  onEdit,
  onDelete,
}: {
  tx: Transaction;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { money, dueLabel } = useLocale();
  const meta = catMeta(tx.category);
  const Icon = meta.icon;
  const income = tx.type === "income";

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className="glass flex items-center gap-3 p-3.5"
    >
      <span className={cn("glass grid size-10 shrink-0 place-items-center !rounded-2xl", income ? "text-emerald-400" : "text-rose-400")}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-strong truncate text-sm font-medium">{tx.note || meta.label}</div>
        <div className="text-muted mt-0.5 flex items-center gap-2 text-xs">
          <span>{meta.label}</span>
          <span aria-hidden>·</span>
          <span>{dueLabel(tx.date)}</span>
        </div>
      </div>
      <div className={cn("flex items-center gap-1 text-sm font-semibold tabular-nums", income ? "text-emerald-500" : "text-rose-500")}>
        {income ? <ArrowDownLeft className="size-3.5" /> : <ArrowUpRight className="size-3.5" />}
        {income ? "+" : "−"}{money(tx.amount, tx.currency)}
      </div>
      <RowMenu items={[{ label: "Edit", icon: Pencil, onClick: onEdit }, { label: "Delete", icon: Trash2, onClick: onDelete, danger: true }]} />
    </motion.div>
  );
}
