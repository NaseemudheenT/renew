"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { AnimatedButton } from "@/components/motion";
import { CATEGORIES, REPEAT_OPTIONS } from "@/lib/categories";
import { toDateInput, fromDateTimeInputs } from "@/lib/dates";
import { useLocale } from "@/components/providers/LocaleProvider";
import { formatAmountTyping, parseAmount, groupingLocale, displayFromValue } from "@/lib/amount-format";
import { CURRENCIES } from "@/lib/utils";
import type { Payment, Category, RepeatRule, PaymentMethod } from "@/lib/types";
import type { PaymentInput } from "@/lib/firestore/payments";

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "bank", label: "Bank transfer" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "cash", label: "Cash" },
  { value: "autopay", label: "Auto-pay" },
  { value: "other", label: "Other" },
];
const REMIND: { value: string; label: string }[] = [
  { value: "0", label: "On the day" },
  { value: "1", label: "1 day before" },
  { value: "3", label: "3 days before" },
  { value: "7", label: "1 week before" },
];

export function PaymentForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial?: Payment;
  submitting: boolean;
  onSubmit: (input: PaymentInput) => void;
  onCancel: () => void;
}) {
  const { prefs } = useLocale();
  const [name, setName] = useState(initial?.name ?? "");
  const [currency, setCurrency] = useState(initial?.currency ?? prefs.currency);
  const [amount, setAmount] = useState(() =>
    initial ? displayFromValue(initial.amount, groupingLocale(prefs.region, initial.currency)) : "",
  );
  const [date, setDate] = useState(() => toDateInput(initial?.dueAt ?? Date.now()));
  const [repeat, setRepeat] = useState<RepeatRule>(initial?.repeat ?? "monthly");
  const [category, setCategory] = useState<Category>(initial?.category ?? "bills");
  const [method, setMethod] = useState<PaymentMethod>(initial?.method ?? "bank");
  const [remind, setRemind] = useState(String(initial?.remindDaysBefore ?? 3));
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [errors, setErrors] = useState<{ name?: string; amount?: string }>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Give the payment a name.";
    const amt = parseAmount(amount);
    if (!amount || Number.isNaN(amt) || amt < 0) next.amount = "Enter a valid amount.";
    setErrors(next);
    if (Object.keys(next).length) return;
    onSubmit({ name: name.trim(), amount: parseAmount(amount), currency, dueAt: fromDateTimeInputs(date), repeat, category, method, remindDaysBefore: Number(remind), notes: notes.trim() || undefined });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Input label="Payment" placeholder="e.g. Home insurance premium" value={name} autoFocus onChange={(e) => setName(e.target.value)} error={errors.name} />
      <div className="grid grid-cols-[1fr_7rem] gap-3">
        <Input label="Amount" type="text" inputMode="decimal" placeholder="0" value={amount} onChange={(e) => setAmount(formatAmountTyping(e.target.value, groupingLocale(prefs.region, currency)).display)} error={errors.amount} />
        <Select label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Due date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Select label="Repeat" value={repeat} onChange={(e) => setRepeat(e.target.value as RepeatRule)} options={REPEAT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))} />
      </div>
      <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value as Category)} options={CATEGORIES.map((c) => ({ value: c.id, label: c.label }))} />
      <div className="grid grid-cols-2 gap-3">
        <Select label="Payment method" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} options={METHODS} />
        <Select label="Remind me" value={remind} onChange={(e) => setRemind(e.target.value)} options={REMIND} />
      </div>
      <Textarea label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <div className="mt-1 flex items-center justify-end gap-3">
        <AnimatedButton type="button" variant="ghost" onClick={onCancel} disabled={submitting}>Cancel</AnimatedButton>
        <AnimatedButton type="submit" loading={submitting}>{initial ? "Save changes" : "Add payment"}</AnimatedButton>
      </div>
    </form>
  );
}
