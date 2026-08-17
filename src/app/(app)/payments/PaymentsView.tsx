"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Plus, Wallet } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { AnimatedButton, AnimatedModal } from "@/components/motion";
import { PaymentRow } from "@/components/payments/PaymentRow";
import { PaymentForm } from "@/components/payments/PaymentForm";
import { toast } from "@/components/ui/toast-store";
import { useUserCollection } from "@/hooks/useUserCollection";
import { createPayment, updatePayment, deletePayment, markPaid, markUnpaid, restorePayment, type PaymentInput } from "@/lib/firestore/payments";
import { dueLabel, isOverdue } from "@/lib/dates";
import type { Payment } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "upcoming" | "paid";

export function PaymentsView() {
  const { data, loading, uid } = useUserCollection<Payment>("payments");
  const [tab, setTab] = useState<Tab>("upcoming");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const upcoming = useMemo(() => data.filter((p) => p.status !== "paid").sort((a, b) => a.dueAt - b.dueAt), [data]);
  const paid = useMemo(() => data.filter((p) => p.status === "paid").sort((a, b) => (b.paidAt ?? 0) - (a.paidAt ?? 0)), [data]);
  const overdue = useMemo(() => upcoming.filter((p) => isOverdue(p.dueAt)), [upcoming]);
  const notOverdue = useMemo(() => upcoming.filter((p) => !isOverdue(p.dueAt)), [upcoming]);

  async function onSubmitForm(input: PaymentInput) {
    if (!uid) return;
    setSubmitting(true);
    try {
      if (editing) {
        await updatePayment(uid, editing.id, input);
        toast({ title: "Payment updated", variant: "success" });
      } else {
        await createPayment(uid, input);
        toast({ title: "Payment added", variant: "success" });
      }
      setModalOpen(false);
      setEditing(null);
    } catch {
      toast({ title: "Something went wrong", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }
  async function onPay(payment: Payment) {
    if (!uid) return;
    const res = await markPaid(uid, payment);
    if (res.rolled && res.nextDue) toast({ title: "Marked paid", description: `Next due ${dueLabel(res.nextDue)}`, variant: "success" });
    else toast({ title: "Marked paid", variant: "success" });
  }
  async function onDelete(payment: Payment) {
    if (!uid) return;
    try {
      await deletePayment(uid, payment.id);
      toast({ title: "Payment deleted", action: { label: "Undo", onClick: () => restorePayment(uid, payment).catch(() => {}) } });
    } catch {
      toast({ title: "Couldn't delete", variant: "error" });
    }
  }
  function openCreate() { setEditing(null); setModalOpen(true); }
  function openEdit(p: Payment) { setEditing(p); setModalOpen(true); }

  const list = tab === "upcoming" ? upcoming : paid;
  const isEmpty = !loading && data.length === 0;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Bills" subtitle="Recurring bills and payments — never miss a due date." action={<AnimatedButton onClick={openCreate}><Plus className="size-4" />New bill</AnimatedButton>} />

      {!isEmpty && (
        <div className="mb-5 grid grid-cols-2 gap-3">
          <GlassCard className="p-4"><div className="text-strong text-xl font-medium tabular-nums">{upcoming.length}</div><div className="text-muted text-xs">Upcoming</div></GlassCard>
          <GlassCard className="p-4"><div className={cn("text-xl font-medium tabular-nums", overdue.length ? "text-rose-500" : "text-[var(--text-strong)]")}>{overdue.length}</div><div className="text-muted text-xs">Overdue</div></GlassCard>
        </div>
      )}

      {!isEmpty && (
        <div className="mb-4 inline-flex rounded-full border border-[var(--field-border)] bg-[var(--field-bg)] p-1 text-sm">
          {(["upcoming", "paid"] as Tab[]).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={cn("rounded-full px-4 py-1.5 capitalize transition-colors", tab === t ? "bg-[var(--glass-bg-strong)] text-[var(--text-strong)] shadow-[inset_0_1px_0_var(--glass-edge)]" : "text-[var(--text-muted)] hover:text-[var(--text-strong)]")}>{t}</button>
          ))}
        </div>
      )}

      {isEmpty ? (
        <GlassCard padded>
          <EmptyState icon={Wallet} title="No payments tracked" description="Add rent, insurance, subscriptions or any bill you want to keep an eye on — and mark them paid as you go." action={<AnimatedButton onClick={openCreate}><Plus className="size-4" />New payment</AnimatedButton>} />
        </GlassCard>
      ) : list.length === 0 ? (
        <GlassCard padded><EmptyState compact icon={Wallet} title={tab === "upcoming" ? "Nothing due — you're clear" : "No paid payments yet"} /></GlassCard>
      ) : tab === "upcoming" ? (
        <div className="flex flex-col gap-6">
          <Section title="Overdue" tone="danger" items={overdue} render={renderRow} />
          <Section title="Upcoming" items={notOverdue} render={renderRow} />
        </div>
      ) : (
        <div className="flex flex-col gap-2"><AnimatePresence initial={false}>{paid.map(renderRow)}</AnimatePresence></div>
      )}

      <AnimatedModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? "Edit payment" : "New payment"}>
        <PaymentForm initial={editing ?? undefined} submitting={submitting} onSubmit={onSubmitForm} onCancel={() => { setModalOpen(false); setEditing(null); }} />
      </AnimatedModal>
    </div>
  );

  function renderRow(p: Payment) {
    return <PaymentRow key={p.id} payment={p} onPay={() => onPay(p)} onUnpay={() => uid && markUnpaid(uid, p.id)} onEdit={() => openEdit(p)} onDelete={() => onDelete(p)} />;
  }
}

function Section({ title, items, render, tone }: { title: string; items: Payment[]; render: (p: Payment) => React.ReactNode; tone?: "danger" }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h2 className={cn("mb-2 px-1 text-xs font-semibold uppercase tracking-wider", tone === "danger" ? "text-rose-500" : "text-[var(--text-muted)]")}>{title}<span className="ml-2 tabular-nums opacity-70">{items.length}</span></h2>
      <div className="flex flex-col gap-2"><AnimatePresence initial={false}>{items.map(render)}</AnimatePresence></div>
    </div>
  );
}
