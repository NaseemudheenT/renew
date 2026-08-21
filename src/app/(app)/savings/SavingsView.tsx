"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, PiggyBank, Pencil, Trash2, Coins } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { AnimatedButton, AnimatedModal } from "@/components/motion";
import { RowMenu } from "@/components/ui/RowMenu";
import { toast } from "@/components/ui/toast-store";
import { useUserCollection } from "@/hooks/useUserCollection";
import { createSavings, updateSavings, deleteSavings, addToSavings } from "@/lib/firestore/savings";
import { toDateInput, fromDateTimeInputs } from "@/lib/dates";
import { useLocale } from "@/components/providers/LocaleProvider";
import { CURRENCIES, cn } from "@/lib/utils";
import type { SavingsGoal } from "@/lib/types";

export function SavingsView() {
  const { money, shortDate, t } = useLocale();
  const { data, loading, uid } = useUserCollection<SavingsGoal>("savings");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const [addTo, setAddTo] = useState<SavingsGoal | null>(null);

  const isEmpty = !loading && data.length === 0;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("nav.savings")} subtitle="Set goals, watch them fill." action={<AnimatedButton onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="size-4" />New goal</AnimatedButton>} />
      {loading ? (
        <ListSkeleton />
      ) : isEmpty ? (
        <GlassCard padded><EmptyState icon={PiggyBank} title="No savings goals yet" description="Create a goal like an emergency fund or a trip, set a target, and track your progress." action={<AnimatedButton onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="size-4" />New goal</AnimatedButton>} /></GlassCard>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <AnimatePresence initial={false}>
            {data.map((g) => {
              const pct = Math.min(100, Math.round((g.current / g.target) * 100));
              const done = g.current >= g.target;
              return (
                <motion.div key={g.id} layout="position" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} className="glass p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-strong truncate text-sm font-medium">{g.name}</p>
                      {g.targetDate ? <p className="text-muted text-xs">by {shortDate(g.targetDate)}</p> : null}
                    </div>
                    <RowMenu items={[{ label: "Add money", icon: Coins, onClick: () => setAddTo(g) }, { label: "Edit", icon: Pencil, onClick: () => { setEditing(g); setModalOpen(true); } }, { label: "Delete", icon: Trash2, onClick: () => uid && deleteSavings(uid, g.id), danger: true }]} />
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-strong text-xl font-medium tabular-nums">{money(g.current, g.currency)}</span>
                    <span className="text-muted text-xs tabular-nums">/ {money(g.target, g.currency)}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--glass-bg-soft)]">
                    <motion.div className={cn("h-full rounded-full", done ? "bg-gradient-to-r from-emerald-400 to-emerald-600" : "bg-gradient-to-r from-gold-300 to-gold-500")} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={cn("text-xs font-medium", done ? "text-emerald-500" : "text-[var(--text-muted)]")}>{done ? "Goal reached 🎉" : `${pct}%`}</span>
                    <button type="button" onClick={() => setAddTo(g)} className="text-xs font-medium text-[var(--color-gold-600)] hover:underline">Add money</button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
      <GoalModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} uid={uid} editing={editing} />
      <AddMoneyModal goal={addTo} uid={uid} onClose={() => setAddTo(null)} />
    </div>
  );
}

function GoalModal({ open, onClose, uid, editing }: { open: boolean; onClose: () => void; uid: string | null; editing: SavingsGoal | null }) {
  const { prefs } = useLocale();
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [currency, setCurrency] = useState(prefs.currency);
  const [hasDate, setHasDate] = useState(false);
  const [date, setDate] = useState(() => toDateInput(Date.now()));
  const [submitting, setSubmitting] = useState(false);
  const [initId, setInitId] = useState<string | null>(null);

  if (open && editing && initId !== editing.id) { setInitId(editing.id); setName(editing.name); setTarget(String(editing.target)); setCurrent(String(editing.current)); setCurrency(editing.currency); setHasDate(editing.targetDate != null); setDate(toDateInput(editing.targetDate ?? editing.createdAt)); }
  if (open && !editing && initId !== "new") { setInitId("new"); setName(""); setTarget(""); setCurrent("0"); setCurrency(prefs.currency); setHasDate(false); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!uid || !name.trim() || Number(target) <= 0) return;
    setSubmitting(true);
    try {
      const payload = { name: name.trim(), target: Number(target), current: Number(current) || 0, currency, targetDate: hasDate ? fromDateTimeInputs(date) : null };
      if (editing) await updateSavings(uid, editing.id, payload);
      else await createSavings(uid, payload);
      toast({ title: editing ? "Goal updated" : "Goal created", variant: "success" });
      setInitId(null);
      onClose();
    } catch {
      toast({ title: "Something went wrong", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatedModal open={open} onClose={() => { setInitId(null); onClose(); }} title={editing ? "Edit goal" : "New savings goal"}>
      <form onSubmit={save} className="flex flex-col gap-4">
        <Input label="Goal name" placeholder="e.g. Emergency fund" value={name} autoFocus onChange={(e) => setName(e.target.value)} />
        <div className="grid grid-cols-[1fr_7rem] gap-3">
          <Input label="Target amount" type="number" min="0" step="0.01" placeholder="0.00" value={target} onChange={(e) => setTarget(e.target.value)} />
          <Select label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
        </div>
        <Input label="Already saved" type="number" min="0" step="0.01" placeholder="0.00" value={current} onChange={(e) => setCurrent(e.target.value)} />
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-body)]">Target date</label>
          {hasDate ? <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /> : <button type="button" onClick={() => setHasDate(true)} className="h-12 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] text-sm text-[var(--text-muted)] hover:text-[var(--text-strong)]">Add a target date</button>}
        </div>
        <div className="mt-1 flex items-center justify-end gap-3">
          <AnimatedButton type="button" variant="ghost" onClick={() => { setInitId(null); onClose(); }} disabled={submitting}>Cancel</AnimatedButton>
          <AnimatedButton type="submit" loading={submitting}>{editing ? "Save" : "Create"}</AnimatedButton>
        </div>
      </form>
    </AnimatedModal>
  );
}

function AddMoneyModal({ goal, uid, onClose }: { goal: SavingsGoal | null; uid: string | null; onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!uid || !goal || Number(amount) <= 0) return;
    setSubmitting(true);
    try {
      await addToSavings(uid, goal.id, Number(amount));
      toast({ title: "Added to savings", variant: "success" });
      setAmount("");
      onClose();
    } catch {
      toast({ title: "Something went wrong", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <AnimatedModal open={Boolean(goal)} onClose={() => { setAmount(""); onClose(); }} title={goal ? `Add to ${goal.name}` : ""}>
      <form onSubmit={save} className="flex flex-col gap-4">
        <Input label="Amount to add" type="number" min="0" step="0.01" placeholder="0.00" value={amount} autoFocus onChange={(e) => setAmount(e.target.value)} />
        <div className="flex items-center justify-end gap-3">
          <AnimatedButton type="button" variant="ghost" onClick={() => { setAmount(""); onClose(); }} disabled={submitting}>Cancel</AnimatedButton>
          <AnimatedButton type="submit" loading={submitting}><Coins className="size-4" />Add</AnimatedButton>
        </div>
      </form>
    </AnimatedModal>
  );
}
