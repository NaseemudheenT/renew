"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, X } from "lucide-react";
import { CategoryIcon } from "./category-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/providers/auth-provider";
import { addReminder } from "@/lib/firestore/reminders";
import { CATEGORIES, CATEGORY_MAP, type CategoryKey } from "@/lib/reminders/categories";
import { todayISO } from "@/lib/reminders/format";
import { cn } from "@/lib/utils";

const SCHEDULE_PRESETS = [90, 60, 30, 14, 7, 3, 1];
const EASE = [0.22, 1, 0.36, 1] as const;

export function AddReminder({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [category, setCategory] = useState<CategoryKey | null>(null);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [schedule, setSchedule] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setCategory(null);
    setTitle("");
    setDueDate("");
    setNotes("");
    setSchedule([]);
    setError("");
    setSaving(false);
  }

  function close() {
    reset();
    onClose();
  }

  function pick(key: CategoryKey) {
    const meta = CATEGORY_MAP[key];
    setCategory(key);
    setTitle(meta.label === "Custom" ? "" : meta.label);
    setSchedule(meta.defaultNotifyDaysBefore);
  }

  function toggleDay(d: number) {
    setSchedule((s) => (s.includes(d) ? s.filter((x) => x !== d) : [...s, d].sort((a, b) => b - a)));
  }

  async function save() {
    if (!user || !category) return;
    if (!title.trim()) return setError("Give it a name");
    if (!dueDate) return setError("Pick a date");
    setSaving(true);
    setError("");
    try {
      await addReminder(user.uid, {
        title: title.trim(),
        category,
        dueDate,
        notes: notes.trim() || undefined,
        notifyDaysBefore: schedule.length ? schedule : [7, 1],
        recurring: CATEGORY_MAP[category].recurring ?? null,
      });
      close();
    } catch {
      setError("Couldn't save. Please try again.");
      setSaving(false);
    }
  }

  const meta = category ? CATEGORY_MAP[category] : null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            aria-label="Close"
            onClick={close}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="glass relative z-10 w-full max-w-lg overflow-hidden rounded-t-[var(--radius-2xl)] sm:rounded-[var(--radius-2xl)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] p-5">
              <div className="flex items-center gap-3">
                {category && (
                  <button
                    onClick={() => setCategory(null)}
                    aria-label="Back to categories"
                    className="grid size-8 place-items-center rounded-full text-[var(--muted)] hover:bg-[var(--surface-hover)]"
                  >
                    <ArrowLeft className="size-4" />
                  </button>
                )}
                <h2 className="text-lg font-medium text-[var(--foreground)]">
                  {category ? meta?.label : "What do you want to remember?"}
                </h2>
              </div>
              <button
                onClick={close}
                aria-label="Close"
                className="grid size-8 place-items-center rounded-full text-[var(--muted)] hover:bg-[var(--surface-hover)]"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-5">
              <div>
                {!category ? (
                  <motion.div
                    key="picker"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-2 gap-2.5 sm:grid-cols-3"
                  >
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.key}
                        onClick={() => pick(c.key)}
                        className="glass glass-interactive flex flex-col items-start gap-3 rounded-[var(--radius-md)] p-4 text-left"
                      >
                        <span className="grid size-9 place-items-center rounded-[var(--radius-sm)] bg-[color-mix(in_oklab,var(--gold)_12%,transparent)] text-[var(--gold)]">
                          <CategoryIcon category={c.key} />
                        </span>
                        <span className="text-sm font-medium text-[var(--foreground)]">
                          {c.label}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    className="flex flex-col gap-4"
                  >
                    <Input
                      label="Name"
                      placeholder={meta?.label}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      autoFocus
                    />
                    <div>
                      <label className="mb-2 block text-xs font-medium tracking-wide text-[var(--muted)]">
                        {meta?.dateLabel}
                      </label>
                      <input
                        type="date"
                        value={dueDate}
                        min={todayISO()}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="glass-input h-12 w-full rounded-[var(--radius-md)] px-4 text-[15px] text-[var(--foreground)]"
                      />
                    </div>

                    {/* Smart schedule */}
                    <div>
                      <label className="mb-2 block text-xs font-medium tracking-wide text-[var(--muted)]">
                        Remind me before
                        <span className="ml-2 text-[var(--subtle)]">(suggested for you)</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {SCHEDULE_PRESETS.map((d) => {
                          const active = schedule.includes(d);
                          return (
                            <button
                              key={d}
                              type="button"
                              onClick={() => toggleDay(d)}
                              className={cn(
                                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                                active
                                  ? "border-[var(--gold)] bg-[color-mix(in_oklab,var(--gold)_16%,transparent)] text-[var(--gold)]"
                                  : "border-[var(--border-strong)] text-[var(--muted)] hover:border-[var(--gold)]",
                              )}
                            >
                              {d} {d === 1 ? "day" : "days"}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <Input
                      label="Notes (optional)"
                      placeholder="Anything else to remember"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />

                    {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

                    <Button size="lg" fullWidth loading={saving} onClick={save} className="mt-1">
                      {!saving && (
                        <>
                          <Check className="size-4" /> Save reminder
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
