"use client";

import { motion } from "framer-motion";
import { Pencil, Trash2, RotateCcw, CalendarClock } from "lucide-react";
import { CompleteToggle } from "@/components/ui/CompleteToggle";
import { RowMenu } from "@/components/ui/RowMenu";
import { dueLabel, isOverdue } from "@/lib/dates";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TaskRow({
  task,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const overdue = !task.completed && task.dueAt != null && isOverdue(task.dueAt);
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className="glass flex items-center gap-3 p-3.5 sm:gap-4"
    >
      <CompleteToggle completed={task.completed} onToggle={onToggle} label={task.completed ? "Mark task active" : "Complete task"} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn("truncate text-sm font-medium", task.completed ? "text-[var(--text-muted)] line-through" : "text-[var(--text-strong)]")}>{task.title}</span>
          {task.priority === "high" && !task.completed && <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-medium text-rose-600 dark:text-rose-300">High</span>}
        </div>
        {task.dueAt != null && (
          <div className="mt-1 flex items-center gap-1 text-xs">
            <CalendarClock className={cn("size-3.5", overdue ? "text-rose-500" : "text-[var(--text-muted)]")} />
            <span className={cn(overdue ? "text-rose-500" : "text-[var(--text-muted)]")}>{dueLabel(task.dueAt)}</span>
          </div>
        )}
      </div>
      <RowMenu
        items={[
          task.completed ? { label: "Reopen", icon: RotateCcw, onClick: onToggle } : { label: "Edit", icon: Pencil, onClick: onEdit },
          { label: "Delete", icon: Trash2, onClick: onDelete, danger: true },
        ]}
      />
    </motion.div>
  );
}
