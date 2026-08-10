"use client";

import { motion } from "framer-motion";
import { Check, Trash2 } from "lucide-react";
import { CategoryIcon } from "./category-icon";
import { CATEGORY_MAP } from "@/lib/reminders/categories";
import { formatDueDate, relativeDue, urgency, type Urgency } from "@/lib/reminders/format";
import type { Reminder } from "@/lib/firestore/types";
import { cn } from "@/lib/utils";

const URGENCY_STYLES: Record<Urgency, string> = {
  overdue: "text-[var(--danger)] border-[color-mix(in_oklab,var(--danger)_40%,transparent)]",
  soon: "text-[var(--gold)] border-[color-mix(in_oklab,var(--gold)_40%,transparent)]",
  upcoming: "text-[var(--muted)] border-[var(--border-strong)]",
  later: "text-[var(--subtle)] border-[var(--border)]",
};

export function ReminderCard({
  reminder,
  onToggle,
  onDelete,
  locale,
}: {
  reminder: Reminder;
  onToggle: (r: Reminder) => void;
  onDelete: (r: Reminder) => void;
  locale?: string;
}) {
  const meta = CATEGORY_MAP[reminder.category];
  const u = urgency(reminder.dueDate);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "glass glass-interactive group flex items-center gap-4 rounded-[var(--radius-lg)] p-4 sm:p-5",
        reminder.completed && "opacity-55",
      )}
    >
      {/* Category glyph */}
      <div className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[color-mix(in_oklab,var(--gold)_12%,transparent)] text-[var(--gold)]">
        <CategoryIcon category={reminder.category} />
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate font-medium text-[var(--foreground)]",
            reminder.completed && "line-through",
          )}
        >
          {reminder.title}
        </p>
        <p className="mt-0.5 text-xs text-[var(--muted)]">
          {meta?.label} · {formatDueDate(reminder.dueDate, locale)}
        </p>
      </div>

      {/* Urgency pill */}
      {!reminder.completed && (
        <span
          className={cn(
            "hidden shrink-0 rounded-full border px-3 py-1 text-xs font-medium sm:inline-block",
            URGENCY_STYLES[u],
          )}
        >
          {relativeDue(reminder.dueDate)}
        </span>
      )}

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onToggle(reminder)}
          aria-label={reminder.completed ? "Mark as not done" : "Mark as done"}
          className={cn(
            "grid size-9 place-items-center rounded-full border transition-colors",
            reminder.completed
              ? "border-[var(--success)] bg-[var(--success)] text-white"
              : "border-[var(--border-strong)] text-[var(--muted)] hover:border-[var(--success)] hover:text-[var(--success)]",
          )}
        >
          <Check className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(reminder)}
          aria-label="Delete reminder"
          className="grid size-9 place-items-center rounded-full text-[var(--subtle)] opacity-0 transition-all hover:text-[var(--danger)] group-hover:opacity-100"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </motion.div>
  );
}
