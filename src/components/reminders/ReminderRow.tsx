"use client";

import { motion } from "framer-motion";
import { Pencil, Trash2, RotateCcw, Repeat } from "lucide-react";
import { CompleteToggle } from "@/components/ui/CompleteToggle";
import { RowMenu } from "@/components/ui/RowMenu";
import { categoryMeta } from "@/lib/categories";
import { dueLabel, isOverdue } from "@/lib/dates";
import type { Reminder } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ReminderRow({
  reminder,
  onComplete,
  onReopen,
  onEdit,
  onDelete,
}: {
  reminder: Reminder;
  onComplete: () => void;
  onReopen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const meta = categoryMeta(reminder.category);
  const overdue = !reminder.completed && isOverdue(reminder.dueAt);
  const Icon = meta.icon;

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className="glass flex items-center gap-3 p-3.5 sm:gap-4"
    >
      <CompleteToggle completed={reminder.completed} onToggle={reminder.completed ? onReopen : onComplete} label={reminder.completed ? "Reopen reminder" : "Complete reminder"} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn("truncate text-sm font-medium", reminder.completed ? "text-[var(--text-muted)] line-through" : "text-[var(--text-strong)]")}>{reminder.title}</span>
          {reminder.priority === "high" && !reminder.completed && (
            <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-medium text-rose-600 dark:text-rose-300">High</span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="text-muted inline-flex items-center gap-1"><Icon className="size-3.5" />{meta.label}</span>
          <span className={cn(overdue ? "text-rose-500" : "text-[var(--text-muted)]")}>{dueLabel(reminder.dueAt, reminder.hasTime)}</span>
          {reminder.repeat !== "none" && <span className="text-muted inline-flex items-center gap-1 capitalize"><Repeat className="size-3.5" />{reminder.repeat}</span>}
        </div>
      </div>
      <RowMenu
        items={
          reminder.completed
            ? [
                { label: "Reopen", icon: RotateCcw, onClick: onReopen },
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
