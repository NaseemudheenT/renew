"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { orderBy } from "firebase/firestore";
import { Plus, Target, Pencil, Trash2, TrendingUp, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { AnimatedButton, AnimatedModal } from "@/components/motion";
import { RowMenu } from "@/components/ui/RowMenu";
import { toast } from "@/components/ui/toast-store";
import { useScopedUserCollection } from "@/hooks/useScopedUserCollection";
import { createBudget, updateBudget, deleteBudget } from "@/lib/firestore/budgets";
import { monthRange, monthPaceProjection } from "@/lib/finance";
import { useCategories } from "@/hooks/useCategories";
import { useLocale } from "@/components/providers/LocaleProvider";
import { formatAmountTyping, parseAmount, groupingLocale, displayFromValue } from "@/lib/amount-format";
import { categoryAverages } from "@/lib/intelligence";
import { SwipeRow } from "@/components/ui/SwipeRow";
import { CURRENCIES, cn } from "@/lib/utils";
import type { Budget, Transaction } from "@/lib/types";

export function BudgetView() {
  const { money, t } = useLocale();
  const { resolve } = useCategories();
  const txC = useMemo(() => [orderBy("date", "desc")], []);
  const { data: budgets, loading, uid } = useScopedUserCollection<Budget>("budgets");
  const { data: txs } = useScopedUserCollection<Transaction>("transactions", txC);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);

  // Spend is keyed by category AND currency so a budget only counts spend in
  // its own currency — mixed currencies are never summed as identical.
  const spentByCat = useMemo(() => {
    const { start, end } = monthRange();
    const m = new Map<string, number>();
    for (const t of txs) if (t.type === "expense" && t.date >= start && t.date < end) {
      const key = `${t.category}|${t.currency}`;
      m.set(key, (m.get(key) ?? 0) + t.amount);
    }
    return m;
  }, [txs]);

  const isEmpty = !loading && budgets.length === 0;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("nav.budget")} subtitle="Set a monthly limit per category — see what's left at a glance." action={<AnimatedButton onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="size-4" />New budget</AnimatedButton>} />
      {loading ? (
        <ListSkeleton />
      ) : isEmpty ? (
        <GlassCard padded>
          <EmptyState icon={Target} title="No budgets yet" description="Create a budget for a category like Food or Transport and Renew tracks your spending against it automatically." action={<AnimatedButton onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="size-4" />New budget</AnimatedButton>} />
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {budgets.map((b) => {
              const meta = resolve(b.category);
              const Icon = meta.icon;
              const spent = spentByCat.get(`${b.category}|${b.currency}`) ?? 0;
              const pct = b.amount > 0 ? Math.min(100, Math.round((spent / b.amount) * 100)) : 0;
              const over = spent > b.amount;
              // Predictive: on this month's pace, will they blow the limit?
              const projected = monthPaceProjection(spent);
              const willExceed = !over && b.amount > 0 && projected > b.amount;
              return (
                <motion.div key={b.id} layout="position" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}>
                <SwipeRow
                  swipeRight={{ label: "Edit", icon: Pencil, bg: "bg-[var(--color-gold-600)]", onTrigger: () => { setEditing(b); setModalOpen(true); } }}
                  swipeLeft={{ label: "Delete", icon: Trash2, bg: "bg-rose-500", onTrigger: () => uid && deleteBudget(uid, b.id) }}
                >
                <div className="glass p-4">
                  <div className="flex items-center gap-3">
                    <span className="glass grid size-10 shrink-0 place-items-center !rounded-2xl"><Icon className="size-5 text-[var(--color-gold-500)]" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-strong text-sm font-medium">{meta.label}</p>
                      <p className="text-muted text-xs tabular-nums">{money(spent, b.currency)} of {money(b.amount, b.currency)}</p>
                    </div>
                    <span className={cn("text-sm font-semibold tabular-nums", over ? "text-rose-500" : "text-[var(--text-strong)]")}>{money(Math.max(0, b.amount - spent), b.currency)}<span className="text-muted ms-1 text-xs font-normal">left</span></span>
                    <RowMenu items={[{ label: "Edit", icon: Pencil, onClick: () => { setEditing(b); setModalOpen(true); } }, { label: "Delete", icon: Trash2, onClick: () => uid && deleteBudget(uid, b.id), danger: true }]} />
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--glass-bg-soft)]">
                    <motion.div className={cn("h-full rounded-full", over ? "bg-gradient-to-r from-rose-400 to-rose-600" : "bg-gradient-to-r from-gold-300 to-gold-500")} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} />
                  </div>
                  {willExceed && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-500">
                      <TrendingUp className="size-3.5" />On this month&apos;s pace you&apos;ll spend ~{money(projected, b.currency)} — {money(projected - b.amount, b.currency)} over.
                    </p>
                  )}
                </div>
                </SwipeRow>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
      <BudgetModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} uid={uid} editing={editing} txns={txs} />
    </div>
  );
}

function BudgetModal({ open, onClose, uid, editing, txns }: { open: boolean; onClose: () => void; uid: string | null; editing: Budget | null; txns: Transaction[] }) {
  const { prefs, money } = useLocale();
  const { forType } = useCategories();
  const [category, setCategory] = useState("food");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(prefs.currency);
  const [submitting, setSubmitting] = useState(false);
  const [initId, setInitId] = useState<string | null>(null);

  // Smart: what this category has actually averaged per month (last 3 months).
  const suggestion = useMemo(() => {
    const avg = categoryAverages(txns, 3).get(category) ?? 0;
    return avg > 0 ? Math.round(avg) : null;
  }, [txns, category]);

  if (open && editing && initId !== editing.id) { setInitId(editing.id); setCategory(editing.category); setAmount(displayFromValue(editing.amount, groupingLocale(prefs.region, editing.currency))); setCurrency(editing.currency); }
  if (open && !editing && initId !== "new") { setInitId("new"); setCategory("food"); setAmount(""); setCurrency(prefs.currency); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!uid) return;
    const amt = parseAmount(amount);
    if (!amount || Number.isNaN(amt) || amt <= 0) return;
    setSubmitting(true);
    try {
      if (editing) await updateBudget(uid, editing.id, { category, amount: amt, currency });
      else await createBudget(uid, { category, amount: amt, currency });
      toast({ title: editing ? "Budget updated" : "Budget created", variant: "success" });
      setInitId(null);
      onClose();
    } catch {
      toast({ title: "Something went wrong", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatedModal open={open} onClose={() => { setInitId(null); onClose(); }} title={editing ? "Edit budget" : "New budget"}>
      <form onSubmit={save} className="flex flex-col gap-4">
        <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)} options={forType("expense").map((c) => ({ value: c.id, label: c.label }))} />
        <div className="grid grid-cols-[1fr_7rem] gap-3">
          <Input label="Monthly limit" type="text" inputMode="decimal" placeholder="0" value={amount} autoFocus onChange={(e) => setAmount(formatAmountTyping(e.target.value, groupingLocale(prefs.region, currency)).display)} />
          <Select label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
        </div>
        {suggestion !== null && (
          <button type="button" onClick={() => setAmount(displayFromValue(suggestion, groupingLocale(prefs.region, currency)))} className="text-body -mt-1 flex w-fit items-center gap-1.5 rounded-full border border-[var(--field-border)] bg-[var(--glass-bg-soft)] px-3 py-1.5 text-xs transition-colors hover:text-[var(--text-strong)]">
            <Sparkles className="size-3.5 text-[var(--color-gold-500)]" />
            You spend about {money(suggestion, currency)}/mo here — use as limit
          </button>
        )}
        <div className="mt-1 flex items-center justify-end gap-3">
          <AnimatedButton type="button" variant="ghost" onClick={() => { setInitId(null); onClose(); }} disabled={submitting}>Cancel</AnimatedButton>
          <AnimatedButton type="submit" loading={submitting}>{editing ? "Save" : "Create"}</AnimatedButton>
        </div>
      </form>
    </AnimatedModal>
  );
}
