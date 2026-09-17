"use client";

import { useMemo, useState } from "react";
import { FileText, Plus, Check, Pencil, Trash2, Briefcase } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { AnimatedButton, AnimatedModal } from "@/components/motion";
import { toast } from "@/components/ui/toast-store";
import { useScopedUserCollection } from "@/hooks/useScopedUserCollection";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import {
  createInvoice, updateInvoice, deleteInvoice, setInvoicePaid, restoreInvoice,
  type InvoiceInput,
} from "@/lib/firestore/invoices";
import { toDateInput, fromDateTimeInputs, isOverdue } from "@/lib/dates";
import { formatAmountTyping, parseAmount, groupingLocale, displayFromValue } from "@/lib/amount-format";
import { CURRENCIES, cn } from "@/lib/utils";
import type { Invoice } from "@/lib/types";

type Derived = "paid" | "overdue" | "due";

function derived(inv: Invoice, now: number): Derived {
  if (inv.status === "paid") return "paid";
  return isOverdue(inv.dueAt) || inv.dueAt < now ? "overdue" : "due";
}

const STATUS_META: Record<Derived, { label: string; cls: string }> = {
  paid: { label: "Paid", cls: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300" },
  overdue: { label: "Overdue", cls: "bg-rose-500/12 text-rose-600 dark:text-rose-300" },
  due: { label: "Unpaid", cls: "bg-[var(--color-gold-500)]/14 text-[var(--color-gold-600)]" },
};

export function InvoicesView() {
  const { mode } = useWorkspace();
  const { prefs, money, date } = useLocale();
  const { data: invoices, uid, loading } = useScopedUserCollection<Invoice>("invoices");
  const [now] = useState(() => Date.now());

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const sorted = useMemo(() => {
    const rank = (i: Invoice) => (i.status === "paid" ? 2 : isOverdue(i.dueAt) ? 0 : 1);
    return [...invoices].sort((a, b) => rank(a) - rank(b) || a.dueAt - b.dueAt);
  }, [invoices]);

  const totals = useMemo(() => {
    let outstanding = 0, paid = 0, overdue = 0, overdueCount = 0;
    for (const i of invoices) {
      if (i.status === "paid") paid += i.amount;
      else {
        outstanding += i.amount;
        if (isOverdue(i.dueAt)) { overdue += i.amount; overdueCount++; }
      }
    }
    return { outstanding, paid, overdue, overdueCount };
  }, [invoices]);

  const currency = invoices[0]?.currency ?? prefs.currency;
  // Suggest the next invoice number (INV-001, INV-002, …) for a new invoice.
  const nextNumber = useMemo(() => `INV-${String(invoices.length + 1).padStart(3, "0")}`, [invoices.length]);

  function openNew() { setEditing(null); setModalOpen(true); }
  function openEdit(inv: Invoice) { setEditing(inv); setModalOpen(true); }

  async function save(input: InvoiceInput) {
    if (!uid) return;
    setSubmitting(true);
    try {
      if (editing) {
        await updateInvoice(uid, editing.id, input);
        toast({ title: "Invoice updated", variant: "success" });
      } else {
        await createInvoice(uid, input);
        toast({ title: "Invoice added", variant: "success" });
      }
      setModalOpen(false);
      setEditing(null);
    } catch {
      toast({ title: "Something went wrong", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function togglePaid(inv: Invoice) {
    if (!uid) return;
    try { await setInvoicePaid(uid, inv.id, inv.status !== "paid"); }
    catch { toast({ title: "Couldn't update", variant: "error" }); }
  }

  async function remove(inv: Invoice) {
    if (!uid) return;
    try {
      await deleteInvoice(uid, inv.id);
      toast({ title: "Invoice deleted", variant: "success", action: { label: "Undo", onClick: () => { void restoreInvoice(uid, inv); } } });
    } catch { toast({ title: "Couldn't delete", variant: "error" }); }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Invoices"
        subtitle="Track what you've billed clients — paid, unpaid and overdue at a glance."
        action={<AnimatedButton size="sm" onClick={openNew}><Plus className="size-4" />New invoice</AnimatedButton>}
      />

      {mode !== "business" && (
        <GlassCard padded className="mb-4">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[var(--glass-bg-strong)]"><Briefcase className="size-5 text-[var(--color-gold-500)]" /></span>
            <div>
              <p className="text-strong text-sm font-medium">Invoices live in your Business workspace</p>
              <p className="text-muted mt-0.5 text-xs">Switch to Business (top of the screen) so your invoices and client work stay separate from your personal money.</p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Summary */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <Stat label="Outstanding" value={money(totals.outstanding, currency)} tone="gold" />
        <Stat label="Overdue" value={money(totals.overdue, currency)} sub={`${totals.overdueCount} invoice${totals.overdueCount === 1 ? "" : "s"}`} tone={totals.overdueCount > 0 ? "rose" : "muted"} />
        <Stat label="Paid" value={money(totals.paid, currency)} tone="emerald" />
      </div>

      <GlassCard padded>
        {loading ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-[var(--field-bg)]" />)}
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState icon={FileText} title="No invoices yet" description="Add the first invoice you've sent a client — Renew tracks paid, unpaid and overdue for you." />
        ) : (
          <ul className="flex flex-col gap-2">
            {sorted.map((inv) => {
              const d = derived(inv, now);
              const meta = STATUS_META[d];
              return (
                <li key={inv.id} className="flex items-center gap-3 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-3">
                  <button type="button" onClick={() => void togglePaid(inv)} aria-label={inv.status === "paid" ? "Mark unpaid" : "Mark paid"}
                    className={cn("grid size-6 shrink-0 place-items-center rounded-full border transition-colors", inv.status === "paid" ? "border-emerald-500 bg-emerald-500 text-white" : "border-[var(--field-border)] hover:border-[var(--focus-ring)]")}>
                    {inv.status === "paid" && <Check className="size-3.5" strokeWidth={3} />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-strong truncate text-sm font-medium">{inv.client || "Client"}</p>
                    <p className="text-muted truncate text-xs">{inv.number} · due {date(new Date(inv.dueAt), { day: "numeric", month: "short" })}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-strong text-sm font-semibold tabular-nums">{money(inv.amount, inv.currency)}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", meta.cls)}>{meta.label}</span>
                  </div>
                  <div className="ms-1 flex shrink-0 items-center">
                    <button type="button" onClick={() => openEdit(inv)} aria-label="Edit invoice" className="text-muted grid size-8 place-items-center rounded-full hover:bg-[var(--glass-bg-soft)] hover:text-[var(--text-strong)]"><Pencil className="size-4" /></button>
                    <button type="button" onClick={() => void remove(inv)} aria-label="Delete invoice" className="text-muted grid size-8 place-items-center rounded-full hover:bg-rose-500/10 hover:text-rose-500"><Trash2 className="size-4" /></button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </GlassCard>

      <AnimatedModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? "Edit invoice" : "New invoice"}>
        <InvoiceForm
          initial={editing}
          defaultCurrency={currency}
          defaultNumber={nextNumber}
          region={prefs.region}
          submitting={submitting}
          onSubmit={save}
          onCancel={() => { setModalOpen(false); setEditing(null); }}
        />
      </AnimatedModal>
    </div>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: "gold" | "rose" | "emerald" | "muted" }) {
  const toneCls = tone === "rose" ? "text-rose-500" : tone === "emerald" ? "text-emerald-500" : tone === "gold" ? "text-[var(--color-gold-600)]" : "text-[var(--text-strong)]";
  return (
    <div className="rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] p-3">
      <p className="text-muted text-xs">{label}</p>
      <p className={cn("mt-1 truncate text-base font-semibold tabular-nums", toneCls)}>{value}</p>
      {sub && <p className="text-muted mt-0.5 truncate text-[11px]">{sub}</p>}
    </div>
  );
}

function InvoiceForm({
  initial, defaultCurrency, defaultNumber, region, submitting, onSubmit, onCancel,
}: {
  initial: Invoice | null;
  defaultCurrency: string;
  defaultNumber: string;
  region?: string;
  submitting: boolean;
  onSubmit: (input: InvoiceInput) => void;
  onCancel: () => void;
}) {
  const [client, setClient] = useState(initial?.client ?? "");
  const [number, setNumber] = useState(initial?.number ?? defaultNumber);
  const [currency, setCurrency] = useState(initial?.currency ?? defaultCurrency);
  const [amount, setAmount] = useState(() =>
    initial ? displayFromValue(initial.amount, groupingLocale(region, initial.currency)) : "",
  );
  const [issued, setIssued] = useState(() => toDateInput(initial?.issuedAt ?? Date.now()));
  const [due, setDue] = useState(() => toDateInput(initial?.dueAt ?? Date.now() + 14 * 86400_000));
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseAmount(amount);
    if (!client.trim()) { setError("Add the client's name."); return; }
    if (!amount || Number.isNaN(amt) || amt <= 0) { setError("Enter a valid amount."); return; }
    setError(null);
    onSubmit({
      number: number.trim() || defaultNumber,
      client: client.trim(),
      amount: amt,
      currency,
      issuedAt: fromDateTimeInputs(issued),
      dueAt: fromDateTimeInputs(due),
      notes: notes.trim(),
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Input label="Client" placeholder="e.g. Acme Co." value={client} autoFocus onChange={(e) => setClient(e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Invoice no." value={number} onChange={(e) => setNumber(e.target.value)} />
        <div>
          <label className="text-body mb-1.5 block text-sm font-medium">Amount</label>
          <div className="flex items-center gap-2">
            <input type="text" inputMode="decimal" placeholder="0" value={amount} aria-label="Amount"
              onChange={(e) => setAmount(formatAmountTyping(e.target.value, groupingLocale(region, currency)).display)}
              className="text-strong h-11 min-w-0 flex-1 rounded-xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3 text-sm tabular-nums outline-none focus:border-[var(--focus-ring)]" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Issued" type="date" value={issued} onChange={(e) => setIssued(e.target.value)} />
        <Input label="Due" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
      </div>
      <Select label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
      <Input label="Notes (optional)" placeholder="What it's for" value={notes} onChange={(e) => setNotes(e.target.value)} />
      {error && <p className="text-xs text-rose-500">{error}</p>}
      <div className="mt-1 flex items-center justify-end gap-3">
        <AnimatedButton type="button" variant="ghost" onClick={onCancel} disabled={submitting}>Cancel</AnimatedButton>
        <AnimatedButton type="submit" loading={submitting}>{initial ? "Save changes" : "Add invoice"}</AnimatedButton>
      </div>
    </form>
  );
}
