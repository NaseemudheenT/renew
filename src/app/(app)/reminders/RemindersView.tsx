"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Plus, Bell, CornerDownLeft } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { AnimatedButton, AnimatedModal } from "@/components/motion";
import { ReminderRow } from "@/components/reminders/ReminderRow";
import { ReminderForm } from "@/components/reminders/ReminderForm";
import { toast } from "@/components/ui/toast-store";
import { useUserCollection } from "@/hooks/useUserCollection";
import {
  createReminder, updateReminder, deleteReminder, completeReminder, reopenReminder, restoreReminder,
  type ReminderInput,
} from "@/lib/firestore/reminders";
import { dueLabel, todayEnd, todayStart } from "@/lib/dates";
import type { Reminder } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "active" | "completed";

export function RemindersView() {
  const { data, loading, uid } = useUserCollection<Reminder>("reminders");
  const [tab, setTab] = useState<Tab>("active");
  const [quick, setQuick] = useState("");
  const [adding, setAdding] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const active = useMemo(() => data.filter((r) => !r.completed).sort((a, b) => a.dueAt - b.dueAt), [data]);
  const completed = useMemo(() => data.filter((r) => r.completed).sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0)), [data]);
  const groups = useMemo(() => {
    const start = todayStart();
    const end = todayEnd();
    return {
      overdue: active.filter((r) => r.dueAt < start),
      today: active.filter((r) => r.dueAt >= start && r.dueAt <= end),
      upcoming: active.filter((r) => r.dueAt > end),
    };
  }, [active]);

  async function onQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!uid || !quick.trim()) return;
    const title = quick.trim();
    setQuick("");
    setAdding(true);
    try {
      const dueAt = new Date();
      dueAt.setHours(9, 0, 0, 0);
      await createReminder(uid, { title, dueAt: dueAt.getTime(), hasTime: false, repeat: "none", category: "other", priority: "normal" });
    } catch {
      toast({ title: "Couldn't add that reminder", variant: "error" });
      setQuick(title);
    } finally {
      setAdding(false);
    }
  }
  async function onSubmitForm(input: ReminderInput) {
    if (!uid) return;
    setSubmitting(true);
    try {
      if (editing) {
        await updateReminder(uid, editing.id, input);
        toast({ title: "Reminder updated", variant: "success" });
      } else {
        await createReminder(uid, input);
        toast({ title: "Reminder created", variant: "success" });
      }
      setModalOpen(false);
      setEditing(null);
    } catch {
      toast({ title: "Something went wrong", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }
  async function onComplete(reminder: Reminder) {
    if (!uid) return;
    try {
      const res = await completeReminder(uid, reminder);
      if (res.renewed && res.nextDue) toast({ title: "Renewed", description: `Next: ${dueLabel(res.nextDue, reminder.hasTime)}`, variant: "success" });
    } catch {
      toast({ title: "Couldn't complete", variant: "error" });
    }
  }
  async function onDelete(reminder: Reminder) {
    if (!uid) return;
    try {
      await deleteReminder(uid, reminder.id);
      toast({ title: "Reminder deleted", action: { label: "Undo", onClick: () => restoreReminder(uid, reminder).catch(() => {}) } });
    } catch {
      toast({ title: "Couldn't delete", variant: "error" });
    }
  }
  function openCreate() { setEditing(null); setModalOpen(true); }
  function openEdit(r: Reminder) { setEditing(r); setModalOpen(true); }

  const list = tab === "active" ? active : completed;
  const isEmpty = !loading && list.length === 0;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Reminders" subtitle="Everything that shouldn't slip — in one calm list." action={<AnimatedButton onClick={openCreate}><Plus className="size-4" />New reminder</AnimatedButton>} />

      <form onSubmit={onQuickAdd} className="mb-5">
        <div className="glass flex items-center gap-2 p-2 ps-4">
          <Bell className="size-4.5 shrink-0 text-[var(--color-gold-500)]" />
          <input value={quick} onChange={(e) => setQuick(e.target.value)} placeholder="Quick add a reminder…" aria-label="Quick add a reminder" className="h-9 flex-1 bg-transparent text-sm text-[var(--text-strong)] placeholder:text-[var(--text-muted)] focus:outline-none" />
          {quick.trim() && (
            <button type="submit" disabled={adding} className="flex items-center gap-1.5 rounded-full bg-gradient-to-b from-gold-200 to-gold-400 px-3 py-1.5 text-xs font-medium text-[var(--text-onGold)] disabled:opacity-60">
              <CornerDownLeft className="size-3.5" />Add
            </button>
          )}
        </div>
      </form>

      <div className="mb-4 inline-flex rounded-full border border-[var(--field-border)] bg-[var(--field-bg)] p-1 text-sm">
        {(["active", "completed"] as Tab[]).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={cn("rounded-full px-4 py-1.5 capitalize transition-colors", tab === t ? "bg-[var(--glass-bg-strong)] text-[var(--text-strong)] shadow-[inset_0_1px_0_var(--glass-edge)]" : "text-[var(--text-muted)] hover:text-[var(--text-strong)]")}>
            {t}
            {t === "active" && active.length > 0 && <span className="ms-1.5 tabular-nums">{active.length}</span>}
          </button>
        ))}
      </div>

      {isEmpty ? (
        <GlassCard padded>
          <EmptyState icon={Bell} title={tab === "active" ? "No active reminders" : "Nothing completed yet"} description={tab === "active" ? "Add your first reminder above, or create one with full details." : "Completed reminders will gather here."} action={tab === "active" ? <AnimatedButton onClick={openCreate}><Plus className="size-4" />New reminder</AnimatedButton> : undefined} />
        </GlassCard>
      ) : tab === "active" ? (
        <div className="flex flex-col gap-6">
          <Section title="Overdue" tone="danger" items={groups.overdue} render={renderRow} />
          <Section title="Today" items={groups.today} render={renderRow} />
          <Section title="Upcoming" items={groups.upcoming} render={renderRow} />
        </div>
      ) : (
        <div className="flex flex-col gap-2"><AnimatePresence initial={false}>{completed.map(renderRow)}</AnimatePresence></div>
      )}

      <AnimatedModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? "Edit reminder" : "New reminder"}>
        <ReminderForm initial={editing ?? undefined} submitting={submitting} onSubmit={onSubmitForm} onCancel={() => { setModalOpen(false); setEditing(null); }} />
      </AnimatedModal>
    </div>
  );

  function renderRow(r: Reminder) {
    return <ReminderRow key={r.id} reminder={r} onComplete={() => onComplete(r)} onReopen={() => uid && reopenReminder(uid, r.id)} onEdit={() => openEdit(r)} onDelete={() => onDelete(r)} />;
  }
}

function Section({ title, items, render, tone }: { title: string; items: Reminder[]; render: (r: Reminder) => React.ReactNode; tone?: "danger" }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h2 className={cn("mb-2 px-1 text-xs font-semibold uppercase tracking-wider", tone === "danger" ? "text-rose-500" : "text-[var(--text-muted)]")}>
        {title}<span className="ms-2 tabular-nums opacity-70">{items.length}</span>
      </h2>
      <div className="flex flex-col gap-2"><AnimatePresence initial={false}>{items.map(render)}</AnimatePresence></div>
    </div>
  );
}
