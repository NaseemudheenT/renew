"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Check, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { AnimatedButton } from "@/components/motion";
import { makeCustomCategoryId } from "@/lib/finance";
import { guessCategory } from "@/lib/import";
import { toDateInput, fromDateTimeInputs } from "@/lib/dates";
import { useLocale } from "@/components/providers/LocaleProvider";
import { formatAmountTyping, parseAmount, groupingLocale, displayFromValue } from "@/lib/amount-format";
import { useCategories } from "@/hooks/useCategories";
import { useAuth } from "@/components/providers/AuthProvider";
import { useScopedUserCollection } from "@/hooks/useScopedUserCollection";
import { addCustomCategory, addCustomSubcategory } from "@/lib/firestore/profile";
import { toast } from "@/components/ui/toast-store";
import { CURRENCIES, cn } from "@/lib/utils";
import type { Transaction, TxType, Account } from "@/lib/types";
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
  const { user } = useAuth();
  const { forType, subsFor } = useCategories();
  const { data: accounts } = useScopedUserCollection<Account>("accounts");
  const activeAccounts = accounts.filter((a) => a.status === "active");
  const [type, setType] = useState<TxType>(initial?.type ?? "expense");
  const [currency, setCurrency] = useState(initial?.currency ?? defaultCurrency ?? prefs.currency);
  const [amount, setAmount] = useState(() =>
    initial ? displayFromValue(initial.amount, groupingLocale(prefs.region, initial.currency)) : "",
  );
  const [category, setCategory] = useState(initial?.category ?? forType(initial?.type ?? "expense")[0]!.id);
  const [subcategory, setSubcategory] = useState(initial?.subcategory ?? "");
  const subs = subsFor(category);
  const [accountId, setAccountId] = useState(initial?.accountId ?? "");
  const selectedAccount = activeAccounts.find((a) => a.id === accountId);
  const [date, setDate] = useState(() => toDateInput(initial?.date ?? Date.now()));
  const [note, setNote] = useState(initial?.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [addingSub, setAddingSub] = useState(false);
  const [newSub, setNewSub] = useState("");
  // Once the person picks a category themselves, stop auto-guessing from the note.
  const [categoryTouched, setCategoryTouched] = useState(Boolean(initial));

  const cats = forType(type);

  function resetSubAdd() {
    setAddingSub(false);
    setNewSub("");
  }
  function switchType(t: TxType) {
    setType(t);
    // Re-guess for the new type from the note, unless they've chosen a category.
    const next = !categoryTouched && note.trim() ? guessCategory(note, t) : forType(t)[0]!.id;
    setCategory(next);
    setSubcategory("");
    resetSubAdd();
  }

  function pickCategory(id: string) {
    setCategoryTouched(true);
    setCategory(id);
    setSubcategory("");
    resetSubAdd();
  }

  /** Smart default: as the note is typed, guess the category — until the person
   *  picks one themselves. Never overrides a manual choice or an edit. */
  function onNoteChange(value: string) {
    setNote(value);
    if (!categoryTouched && value.trim()) {
      const guess = guessCategory(value, type);
      if (guess !== category) {
        setCategory(guess);
        setSubcategory("");
      }
    }
  }

  async function saveCustomSub() {
    const label = newSub.trim();
    if (!label || !user) return;
    try {
      await addCustomSubcategory(user.uid, category, label);
      setSubcategory(label);
      resetSubAdd();
    } catch {
      toast({ title: "Couldn't add subcategory", variant: "error" });
    }
  }

  async function saveCustom() {
    const label = newCat.trim();
    if (!label || !user) return;
    const cat = { id: makeCustomCategoryId(label, type), label, type };
    try {
      await addCustomCategory(user.uid, cat);
      pickCategory(cat.id);
      setNewCat("");
      setAdding(false);
    } catch {
      toast({ title: "Couldn't add category", variant: "error" });
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseAmount(amount);
    if (!amount || Number.isNaN(amt) || amt <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    setError(null);
    // A transaction attributed to an account MUST use that account's currency,
    // otherwise it silently drops out of the account's balance.
    const effectiveCurrency = selectedAccount ? selectedAccount.currency : currency;
    onSubmit({ type, amount: amt, currency: effectiveCurrency, category, subcategory: subcategory || undefined, note: note.trim() || undefined, date: fromDateTimeInputs(date), accountId: accountId || undefined });
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
        <Input label="Amount" type="text" inputMode="decimal" placeholder="0" value={amount} autoFocus onChange={(e) => setAmount(formatAmountTyping(e.target.value, groupingLocale(prefs.region, selectedAccount ? selectedAccount.currency : currency)).display)} error={error ?? undefined} />
        <Select label="Currency" value={selectedAccount ? selectedAccount.currency : currency} onChange={(e) => setCurrency(e.target.value)} disabled={!!selectedAccount} options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
      </div>

      <div>
        <Select label="Category" value={category} onChange={(e) => pickCategory(e.target.value)} options={cats.map((c) => ({ value: c.id, label: c.label }))} />
        {adding ? (
          <div className="mt-2 flex items-center gap-2">
            <Input
              placeholder="New category name"
              value={newCat}
              autoFocus
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveCustom(); } }}
            />
            <AnimatedButton type="button" size="sm" onClick={saveCustom} disabled={!newCat.trim()} aria-label="Save category"><Check className="size-4" /></AnimatedButton>
            <AnimatedButton type="button" size="sm" variant="ghost" onClick={() => { setAdding(false); setNewCat(""); }} aria-label="Cancel"><X className="size-4" /></AnimatedButton>
          </div>
        ) : (
          <button type="button" onClick={() => setAdding(true)} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-gold-600)] hover:underline">
            <Plus className="size-3.5" /> New category
          </button>
        )}
      </div>
      <div>
        <Select
          label="Subcategory (optional)"
          value={subcategory}
          onChange={(e) => setSubcategory(e.target.value)}
          options={[{ value: "", label: "None" }, ...subs.map((s) => ({ value: s, label: s }))]}
        />
        {addingSub ? (
          <div className="mt-2 flex items-center gap-2">
            <Input
              placeholder="New subcategory name"
              value={newSub}
              autoFocus
              onChange={(e) => setNewSub(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveCustomSub(); } }}
            />
            <AnimatedButton type="button" size="sm" onClick={saveCustomSub} disabled={!newSub.trim()} aria-label="Save subcategory"><Check className="size-4" /></AnimatedButton>
            <AnimatedButton type="button" size="sm" variant="ghost" onClick={resetSubAdd} aria-label="Cancel"><X className="size-4" /></AnimatedButton>
          </div>
        ) : (
          <button type="button" onClick={() => setAddingSub(true)} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-gold-600)] hover:underline">
            <Plus className="size-3.5" /> New subcategory
          </button>
        )}
      </div>
      {activeAccounts.length > 0 && (
        <Select
          label="Account (optional)"
          value={accountId}
          onChange={(e) => {
            const next = e.target.value;
            setAccountId(next);
            const acc = activeAccounts.find((a) => a.id === next);
            if (acc) setCurrency(acc.currency);
          }}
          options={[{ value: "", label: "Unassigned" }, ...activeAccounts.map((a) => ({ value: a.id, label: `${a.name} (${a.currency})` }))]}
        />
      )}
      <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <Input label="Note (optional)" placeholder="e.g. Lunch with team" value={note} onChange={(e) => onNoteChange(e.target.value)} />

      <div className="mt-1 flex items-center justify-end gap-3">
        <AnimatedButton type="button" variant="ghost" onClick={onCancel} disabled={submitting}>Cancel</AnimatedButton>
        <AnimatedButton type="submit" loading={submitting}>{initial ? "Save changes" : "Add transaction"}</AnimatedButton>
      </div>
    </form>
  );
}
