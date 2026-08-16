"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { AnimatedButton } from "@/components/motion";
import { CATEGORIES, REPEAT_OPTIONS, PRIORITY_OPTIONS } from "@/lib/categories";
import { toDateInput, toTimeInput, fromDateTimeInputs } from "@/lib/dates";
import type { Reminder, Category, Priority, RepeatRule } from "@/lib/types";
import type { ReminderInput } from "@/lib/firestore/reminders";

const categoryOptions = CATEGORIES.map((c) => ({ value: c.id, label: c.label }));

export function ReminderForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial?: Reminder;
  submitting: boolean;
  onSubmit: (input: ReminderInput) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(() =>
    toDateInput(initial?.dueAt ?? Date.now()),
  );
  const [hasTime, setHasTime] = useState(initial?.hasTime ?? false);
  const [time, setTime] = useState(() =>
    toTimeInput(initial?.dueAt ?? Date.now()),
  );
  const [repeat, setRepeat] = useState<RepeatRule>(initial?.repeat ?? "none");
  const [category, setCategory] = useState<Category>(
    initial?.category ?? "other",
  );
  const [priority, setPriority] = useState<Priority>(
    initial?.priority ?? "normal",
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Give your reminder a title.");
      return;
    }
    setError(null);
    onSubmit({
      title: title.trim(),
      notes: notes.trim() || undefined,
      dueAt: fromDateTimeInputs(date, hasTime ? time : undefined),
      hasTime,
      repeat,
      category,
      priority,
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Input
        label="Reminder"
        placeholder="e.g. Renew car insurance"
        value={title}
        autoFocus
        onChange={(e) => setTitle(e.target.value)}
        error={error ?? undefined}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-body)]">
            Time
          </label>
          {hasTime ? (
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setHasTime(true)}
              className="h-12 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-strong)]"
            >
              Add a time
            </button>
          )}
        </div>
      </div>
      {hasTime && (
        <button
          type="button"
          onClick={() => setHasTime(false)}
          className="-mt-2 self-start text-xs text-[var(--text-muted)] hover:text-[var(--text-strong)]"
        >
          Make it all-day
        </button>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Repeat"
          value={repeat}
          onChange={(e) => setRepeat(e.target.value as RepeatRule)}
          options={REPEAT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        />
        <Select
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          options={categoryOptions}
        />
      </div>

      <Select
        label="Priority"
        value={priority}
        onChange={(e) => setPriority(e.target.value as Priority)}
        options={PRIORITY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
      />

      <Textarea
        label="Notes (optional)"
        placeholder="Anything worth remembering…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <div className="mt-1 flex items-center justify-end gap-3">
        <AnimatedButton type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </AnimatedButton>
        <AnimatedButton type="submit" loading={submitting}>
          {initial ? "Save changes" : "Create reminder"}
        </AnimatedButton>
      </div>
    </form>
  );
}
