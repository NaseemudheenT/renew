"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { AnimatedButton } from "@/components/motion";
import { categoriesFor } from "@/lib/finance";
import { toDateInput, fromDateTimeInputs } from "@/lib/dates";
import { useLocale } from "@/components/providers/LocaleProvider";
import { CURRENCIES, cn } from "@/lib/utils";
import type { Transaction, TxType } from "@/lib/types";
import type { TransactionInput } from "@/lib/firestore/transactions";

export function TransactionForm({
  initial,
  defaultCurrency,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial?: Transaction;
  defaultCurrency?: string;
  submitting: boolean;
  onSubmit: (input: TransactionInput) => void;
  onCancel: () => void;
}) {
  const { prefs } = useLocale();
  const [type, setType] = useState<TxType>(initial?.type ?? "expense");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [currency, setCurrency] = useState(initial?.currency ?? defaultCurrency ?? prefs.currency);
  const [category, setCategory] = useState(initial?.category ?? categoriesFor(initial?.type ?? "expense")[0]!.id);
  const [date, setDate] = useState(() => toDateInput(initial?.date ?? Date.now()));
  const [note, setNote] = useState(initial?.note ?? "");
  const [error, setError] = useState<string | null>(null);

  const cats = categoriesFor(type);

  function switchType(t: TxType) {
    setType(t);
    setCategory(categoriesFor(t)[0]!.id);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!amount || Number.isNaN(amt) || amt <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    setError(null);
    onSubmit({ type, amount: amt, currency, category, note: note.trim() || undefined, date: fromDateTimeInputs(date) });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {/* Income / Expense segmented */}
      <div className="relative grid grid-cols-2 rounded-full border border-[var(--field-border)] bg-[var(--field-bg)] p-1 text-sm">
        {(["expense", "income"] as TxType[]).map((t) => (
          <button key={t} type="button" onClick={() => switchType(t)} className="relative z-10 rounded-full py-2 font-medium capitalize transition-colors">
            <span className={cn(type === t ? (t === "income" ? "text-emerald-500" : "text-rose-500") : "text-[var(--text-muted)]")}>{t}</span>
          </button>
        ))}
        <motion.span layout className={cn("absolute inset-y-1 z-0 w-[calc(50%-0.25rem)] rounded-full", type === "income" ? "left-[calc(50%+0.125rem)] bg-emerald-500/15" : "left-1 bg-rose-500/15")} transition={{ type: "spring", stiffness: 400, damping: 32 }} />
      </div>

      <div className="grid grid-cols-[1fr_7rem] gap-3">
        <Input label="Amount" type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00" value={amount} autoFocus onChange={(e) => setAmount(e.target.value)} error={error ?? undefined} />
        <Select label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
      </div>

      <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)} options={cats.map((c) => ({ value: c.id, label: c.label }))} />
      <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <Input label="Note (optional)" placeholder="e.g. Lunch with team" value={note} onChange={(e) => setNote(e.target.value)} />

      <div className="mt-1 flex items-center justify-end gap-3">
        <AnimatedButton type="button" variant="ghost" onClick={onCancel} disabled={submitting}>Cancel</AnimatedButton>
        <AnimatedButton type="submit" loading={submitting}>{initial ? "Save changes" : "Add transaction"}</AnimatedButton>
      </div>
    </form>
  );
}
