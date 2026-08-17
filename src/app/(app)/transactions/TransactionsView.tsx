"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { orderBy } from "firebase/firestore";
import { Plus, ArrowLeftRight, Search } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { AnimatedButton, AnimatedModal } from "@/components/motion";
import { TransactionRow } from "@/components/finance/TransactionRow";
import { TransactionForm } from "@/components/finance/TransactionForm";
import { toast } from "@/components/ui/toast-store";
import { useUserCollection } from "@/hooks/useUserCollection";
import {
  createTransaction, updateTransaction, deleteTransaction, restoreTransaction, type TransactionInput,
} from "@/lib/firestore/transactions";
import { catMeta } from "@/lib/finance";
import { format } from "date-fns";
import type { Transaction, TxType } from "@/lib/types";
import { cn } from "@/lib/utils";

type Filter = "all" | TxType;

export function TransactionsView() {
  const constraints = useMemo(() => [orderBy("date", "desc")], []);
  const { data, loading, uid } = useUserCollection<Transaction>("transactions", constraints);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return data
      .filter((t) => (filter === "all" ? true : t.type === filter))
      .filter((t) => (query ? (t.note ?? "").toLowerCase().includes(query) || catMeta(t.category).label.toLowerCase().includes(query) : true));
  }, [data, filter, q]);

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of filtered) {
      const key = format(new Date(t.date), "EEEE, d MMM yyyy");
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  async function onSubmit(input: TransactionInput) {
    if (!uid) return;
    setSubmitting(true);
    try {
      if (editing) {
        await updateTransaction(uid, editing.id, input);
        toast({ title: "Transaction updated", variant: "success" });
      } else {
        await createTransaction(uid, input);
        toast({ title: "Transaction added", variant: "success" });
      }
      setModalOpen(false);
      setEditing(null);
    } catch {
      toast({ title: "Something went wrong", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }
  async function onDelete(tx: Transaction) {
    if (!uid) return;
    try {
      await deleteTransaction(uid, tx.id);
      toast({ title: "Transaction deleted", action: { label: "Undo", onClick: () => restoreTransaction(uid, tx).catch(() => {}) } });
    } catch {
      toast({ title: "Couldn't delete", variant: "error" });
    }
  }
  function openCreate() { setEditing(null); setModalOpen(true); }
  function openEdit(t: Transaction) { setEditing(t); setModalOpen(true); }

  const isEmpty = !loading && data.length === 0;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Transactions" subtitle="Every rupee in and out — captured in seconds." action={<AnimatedButton onClick={openCreate}><Plus className="size-4" />Add</AnimatedButton>} />

      {!isEmpty && (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="glass flex flex-1 items-center gap-2 p-2 pl-4">
            <Search className="size-4.5 shrink-0 text-[var(--text-muted)]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search transactions…" aria-label="Search transactions" className="h-9 flex-1 bg-transparent text-sm text-[var(--text-strong)] placeholder:text-[var(--text-muted)] focus:outline-none" />
          </div>
          <div className="inline-flex rounded-full border border-[var(--field-border)] bg-[var(--field-bg)] p-1 text-sm">
            {(["all", "income", "expense"] as Filter[]).map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)} className={cn("rounded-full px-3.5 py-1.5 capitalize transition-colors", filter === f ? "bg-[var(--glass-bg-strong)] text-[var(--text-strong)]" : "text-[var(--text-muted)] hover:text-[var(--text-strong)]")}>{f}</button>
            ))}
          </div>
        </div>
      )}

      {isEmpty ? (
        <GlassCard padded>
          <EmptyState icon={ArrowLeftRight} title="No transactions yet" description="Add your first income or expense — it takes seconds and everything else updates automatically." action={<AnimatedButton onClick={openCreate}><Plus className="size-4" />Add transaction</AnimatedButton>} />
        </GlassCard>
      ) : filtered.length === 0 ? (
        <GlassCard padded><EmptyState compact icon={Search} title="No matches" description="Try a different search or filter." /></GlassCard>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map(([day, items]) => (
            <div key={day}>
              <h2 className="text-muted mb-2 px-1 text-xs font-semibold uppercase tracking-wider">{day}</h2>
              <div className="flex flex-col gap-2">
                <AnimatePresence initial={false}>
                  {items.map((t) => <TransactionRow key={t.id} tx={t} onEdit={() => openEdit(t)} onDelete={() => onDelete(t)} />)}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatedModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? "Edit transaction" : "Add transaction"}>
        <TransactionForm initial={editing ?? undefined} submitting={submitting} onSubmit={onSubmit} onCancel={() => { setModalOpen(false); setEditing(null); }} />
      </AnimatedModal>
    </div>
  );
}
