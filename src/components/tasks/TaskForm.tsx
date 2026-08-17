"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { AnimatedButton } from "@/components/motion";
import { PRIORITY_OPTIONS } from "@/lib/categories";
import { toDateInput, fromDateTimeInputs } from "@/lib/dates";
import type { Task, Priority } from "@/lib/types";
import type { TaskInput } from "@/lib/firestore/tasks";

export function TaskForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial?: Task;
  submitting: boolean;
  onSubmit: (input: TaskInput) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [hasDue, setHasDue] = useState(Boolean(initial?.dueAt));
  const [date, setDate] = useState(() => toDateInput(initial?.dueAt ?? Date.now()));
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? "normal");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Give your task a title.");
      return;
    }
    setError(null);
    onSubmit({ title: title.trim(), notes: notes.trim() || undefined, dueAt: hasDue ? fromDateTimeInputs(date) : null, priority });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Input label="Task" placeholder="e.g. Call the bank" value={title} autoFocus onChange={(e) => setTitle(e.target.value)} error={error ?? undefined} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-body)]">Due date</label>
          {hasDue ? (
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          ) : (
            <button type="button" onClick={() => setHasDue(true)} className="h-12 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-strong)]">
              Add a due date
            </button>
          )}
        </div>
        <Select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as Priority)} options={PRIORITY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))} />
      </div>
      {hasDue && (
        <button type="button" onClick={() => setHasDue(false)} className="-mt-2 self-start text-xs text-[var(--text-muted)] hover:text-[var(--text-strong)]">Remove due date</button>
      )}
      <Textarea label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <div className="mt-1 flex items-center justify-end gap-3">
        <AnimatedButton type="button" variant="ghost" onClick={onCancel} disabled={submitting}>Cancel</AnimatedButton>
        <AnimatedButton type="submit" loading={submitting}>{initial ? "Save changes" : "Create task"}</AnimatedButton>
      </div>
    </form>
  );
}
