"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Plus, ListTodo, CornerDownLeft } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { AnimatedButton, AnimatedModal } from "@/components/motion";
import { TaskRow } from "@/components/tasks/TaskRow";
import { TaskForm } from "@/components/tasks/TaskForm";
import { toast } from "@/components/ui/toast-store";
import { useUserCollection } from "@/hooks/useUserCollection";
import { createTask, updateTask, deleteTask, setTaskCompleted, restoreTask, type TaskInput } from "@/lib/firestore/tasks";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "active" | "completed";

export function TasksView() {
  const { data, loading, uid } = useUserCollection<Task>("tasks");
  const [tab, setTab] = useState<Tab>("active");
  const [quick, setQuick] = useState("");
  const [adding, setAdding] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const active = useMemo(
    () =>
      data.filter((t) => !t.completed).sort((a, b) => {
        if (a.dueAt != null && b.dueAt != null) return a.dueAt - b.dueAt;
        if (a.dueAt != null) return -1;
        if (b.dueAt != null) return 1;
        return b.order - a.order;
      }),
    [data],
  );
  const completed = useMemo(() => data.filter((t) => t.completed).sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0)), [data]);

  async function onQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!uid || !quick.trim()) return;
    const title = quick.trim();
    setQuick("");
    setAdding(true);
    try {
      await createTask(uid, { title, priority: "normal", dueAt: null });
    } catch {
      toast({ title: "Couldn't add that task", variant: "error" });
      setQuick(title);
    } finally {
      setAdding(false);
    }
  }
  async function onSubmitForm(input: TaskInput) {
    if (!uid) return;
    setSubmitting(true);
    try {
      if (editing) {
        await updateTask(uid, editing.id, input);
        toast({ title: "Task updated", variant: "success" });
      } else {
        await createTask(uid, input);
        toast({ title: "Task created", variant: "success" });
      }
      setModalOpen(false);
      setEditing(null);
    } catch {
      toast({ title: "Something went wrong", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }
  async function onToggle(task: Task) {
    if (!uid) return;
    await setTaskCompleted(uid, task.id, !task.completed).catch(() => toast({ title: "Couldn't update", variant: "error" }));
  }
  async function onDelete(task: Task) {
    if (!uid) return;
    try {
      await deleteTask(uid, task.id);
      toast({ title: "Task deleted", action: { label: "Undo", onClick: () => restoreTask(uid, task).catch(() => {}) } });
    } catch {
      toast({ title: "Couldn't delete", variant: "error" });
    }
  }
  function openCreate() { setEditing(null); setModalOpen(true); }
  function openEdit(t: Task) { setEditing(t); setModalOpen(true); }

  const list = tab === "active" ? active : completed;
  const isEmpty = !loading && list.length === 0;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Tasks" subtitle="Quick to capture, satisfying to finish." action={<AnimatedButton onClick={openCreate}><Plus className="size-4" />New task</AnimatedButton>} />

      <form onSubmit={onQuickAdd} className="mb-5">
        <div className="glass flex items-center gap-2 p-2 pl-4">
          <ListTodo className="size-4.5 shrink-0 text-[var(--color-gold-500)]" />
          <input value={quick} onChange={(e) => setQuick(e.target.value)} placeholder="Quick add a task…" aria-label="Quick add a task" className="h-9 flex-1 bg-transparent text-sm text-[var(--text-strong)] placeholder:text-[var(--text-muted)] focus:outline-none" />
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
            {t === "active" && active.length > 0 && <span className="ml-1.5 tabular-nums">{active.length}</span>}
          </button>
        ))}
      </div>

      {isEmpty ? (
        <GlassCard padded>
          <EmptyState icon={ListTodo} title={tab === "active" ? "No active tasks" : "Nothing completed yet"} description={tab === "active" ? "Capture your first task above — a title is all you need." : "Finished tasks will gather here."} action={tab === "active" ? <AnimatedButton onClick={openCreate}><Plus className="size-4" />New task</AnimatedButton> : undefined} />
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {list.map((task) => <TaskRow key={task.id} task={task} onToggle={() => onToggle(task)} onEdit={() => openEdit(task)} onDelete={() => onDelete(task)} />)}
          </AnimatePresence>
        </div>
      )}

      <AnimatedModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? "Edit task" : "New task"}>
        <TaskForm initial={editing ?? undefined} submitting={submitting} onSubmit={onSubmitForm} onCancel={() => { setModalOpen(false); setEditing(null); }} />
      </AnimatedModal>
    </div>
  );
}
