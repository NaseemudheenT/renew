"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Check, X, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { AnimatedButton } from "@/components/motion";
import { makeCustomCategoryId } from "@/lib/finance";
import { categorize, merchantKey } from "@/lib/categorize";
import { learnCategory } from "@/lib/firestore/profile";
import { useUserProfile } from "@/hooks/useUserProfile";
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
  defaultType = "expense",
  submitting,
  onSubmit,
  onCancel,
}: {
  initial?: Transaction;
  defaultCurrency?: string;
  /** Type to start on for a new entry (e.g. "income" on the Income page). */
  defaultType?: TxType;
  submitting: boolean;
  onSubmit: (input: TransactionInput) => void;
  onCancel: () => void;
}) {
  const { prefs } = useLocale();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const learned = profile?.learnedCategories;
  const { forType, subsFor, resolve } = useCategories();
  const { data: accounts } = useScopedUserCollection<Account>("accounts");
  const activeAccounts = accounts.filter((a) => a.status === "active");
  const [type, setType] = useState<TxType>(initial?.type ?? defaultType);
  const [currency, setCurrency] = useState(initial?.currency ?? defaultCurrency ?? prefs.currency);
  const [amount, setAmount] = useState(() =>
    initial ? displayFromValue(initial.amount, groupingLocale(prefs.region, initial.currency)) : "",
  );
  const [category, setCategory] = useState(initial?.category ?? forType(initial?.type ?? defaultType)[0]!.id);
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
  // Secondary fields stay tucked away when adding (amount + category is enough);
  // when editing an existing entry, open them so everything is visible.
  const [showDetails, setShowDetails] = useState(Boolean(initial));

  const cats = forType(type);

  function resetSubAdd() {
    setAddingSub(false);
    setNewSub("");
  }
  function switchType(t: TxType) {
    setType(t);
    // Re-guess for the new type from the note, unless they've chosen a category.
    const next = !categoryTouched && note.trim() ? categorize(note, t, learned ?? {}).category : forType(t)[0]!.id;
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
      const guess = categorize(value, type, learned ?? {}).category;
      if (guess !== category) {
        setCategory(guess);
        setSubcategory("");
      }
    }
  }

  async function saveCustomSub() {
    const label = newSub.trim();
    if (!label || !user) return;
    // Duplicate guard: if this subcategory already exists (any case), select it
    // instead of silently creating a second one.
    const existingSub = subs.find((s) => s.toLowerCase() === label.toLowerCase());
    if (existingSub) {
      setSubcategory(existingSub);
      resetSubAdd();
      toast({ title: "That subcategory already exists", description: `Using “${existingSub}”.` });
      return;
    }
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
    // Duplicate guard (§3): if a category with this name already exists for this
    // type — built-in OR custom — pick it and tell the user, never create a
    // duplicate. Applies to both expense and income categories.
    const existing = cats.find((c) => c.label.toLowerCase() === label.toLowerCase());
    if (existing) {
      pickCategory(existing.id);
      setNewCat("");
      setAdding(false);
      toast({ title: "That category already exists", description: `Using “${existing.label}”.` });
      return;
    }
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
    // Send "" (not undefined) for cleared optionals so an edit that empties a
    // field actually persists the clear (createTransaction stores "" too).
    onSubmit({ type, amount: amt, currency: effectiveCurrency, category, subcategory: subcategory.trim(), note: note.trim(), date: fromDateTimeInputs(date), accountId });
    // Teach the on-device categorizer: this description → this category. Next
    // time the same merchant appears it auto-fills (no AI call, per-user memory).
    if (user && note.trim()) {
      void learnCategory(user.uid, learned, merchantKey(note), category);
    }
  }

  const effCurrency = selectedAccount ? selectedAccount.currency : currency;

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      {/* Income / Expense segmented */}
      <div className="relative grid grid-cols-2 rounded-full border border-[var(--field-border)] bg-[var(--field-bg)] p-1 text-sm">
        {(["expense", "income"] as TxType[]).map((t) => (
          <button key={t} type="button" onClick={() => switchType(t)} className="relative z-10 rounded-full py-2 font-medium capitalize transition-colors">
            <span className={cn(type === t ? (t === "income" ? "text-emerald-500" : "text-rose-500") : "text-[var(--text-muted)]")}>{t}</span>
          </button>
        ))}
        <motion.span layout className={cn("absolute inset-y-1 z-0 w-[calc(50%-0.25rem)] rounded-full", type === "income" ? "left-[calc(50%+0.125rem)] bg-emerald-500/15" : "left-1 bg-rose-500/15")} transition={{ type: "spring", stiffness: 400, damping: 32 }} />
      </div>

      {/* Hero amount — the one thing that matters, big and clear (iOS-style) */}
      <div className="flex flex-col items-center py-3">
        <div className="flex max-w-full items-baseline justify-center gap-1.5">
          <span className="text-muted text-lg font-medium">{effCurrency}</span>
          <input
            type="text" inputMode="decimal" placeholder="0" value={amount} autoFocus aria-label="Amount"
            onChange={(e) => setAmount(formatAmountTyping(e.target.value, groupingLocale(prefs.region, effCurrency)).display)}
            className={cn("min-w-[2ch] max-w-full bg-transparent text-center text-5xl font-light tabular-nums outline-none placeholder:text-[var(--text-muted)]/50",
              type === "income" ? "text-emerald-500" : "text-[var(--text-strong)]")}
            style={{ width: `${Math.max(2, amount.length + 1)}ch` }}
          />
        </div>
        {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
      </div>

      {/* What was it for — drives the smart category guess */}
      <Input label="What was it for?" placeholder="e.g. Lunch, Salary, Rent" value={note} onChange={(e) => onNoteChange(e.target.value)} />

      {/* Category — a clean, consistent icon grid (same for expense & income) */}
      <div>
        <p className="text-body mb-2 text-sm font-medium">Category</p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {cats.map((c) => {
            const Icon = resolve(c.id).icon;
            const on = category === c.id;
            return (
              <button key={c.id} type="button" onClick={() => pickCategory(c.id)} aria-pressed={on}
                className={cn("flex flex-col items-center gap-1.5 rounded-2xl border p-2 text-center transition-all active:scale-95",
                  on ? "border-[var(--color-gold-500)] bg-[var(--color-gold-500)]/10" : "border-[var(--field-border)] bg-[var(--field-bg)] hover:border-[var(--focus-ring)]/50")}>
                <span className={cn("grid size-9 place-items-center rounded-full transition-colors",
                  on ? "bg-[var(--color-gold-500)]/18 text-[var(--color-gold-600)]" : "bg-[var(--glass-bg-strong)] text-[var(--text-muted)]")}>
                  <Icon className="size-4.5" />
                </span>
                <span className={cn("w-full truncate text-[11px] font-medium leading-tight", on ? "text-[var(--text-strong)]" : "text-[var(--text-body)]")}>{c.label}</span>
              </button>
            );
          })}
          {!adding && (
            <button type="button" onClick={() => setAdding(true)} aria-label="New category"
              className="flex flex-col items-center gap-1.5 rounded-2xl border border-dashed border-[var(--field-border)] p-2 text-center text-[var(--color-gold-600)] transition-all hover:border-[var(--focus-ring)]/60 active:scale-95">
              <span className="grid size-9 place-items-center rounded-full bg-[var(--glass-bg-strong)]"><Plus className="size-4.5" /></span>
              <span className="text-[11px] font-medium leading-tight">New</span>
            </button>
          )}
        </div>
        {adding && (
          <div className="mt-2 flex items-center gap-2">
            <Input placeholder="New category name" value={newCat} autoFocus onChange={(e) => setNewCat(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveCustom(); } }} />
            <AnimatedButton type="button" size="sm" onClick={saveCustom} disabled={!newCat.trim()} aria-label="Save category"><Check className="size-4" /></AnimatedButton>
            <AnimatedButton type="button" size="sm" variant="ghost" onClick={() => { setAdding(false); setNewCat(""); }} aria-label="Cancel"><X className="size-4" /></AnimatedButton>
          </div>
        )}
      </div>

      {/* More details — tucked away so the common path stays a few taps */}
      <button type="button" onClick={() => setShowDetails((v) => !v)} className="text-muted inline-flex w-fit items-center gap-1 text-xs font-medium transition-colors hover:text-[var(--text-strong)]">
        <ChevronDown className={cn("size-3.5 transition-transform", showDetails && "rotate-180")} /> {showDetails ? "Fewer details" : "More details"}
      </button>

      {showDetails && (
        <div className="flex flex-col gap-4">
          {(subs.length > 0 || addingSub) && (
            <div>
              <Select label="Subcategory (optional)" value={subcategory} onChange={(e) => setSubcategory(e.target.value)} options={[{ value: "", label: "None" }, ...subs.map((s) => ({ value: s, label: s }))]} />
              {addingSub ? (
                <div className="mt-2 flex items-center gap-2">
                  <Input placeholder="New subcategory name" value={newSub} autoFocus onChange={(e) => setNewSub(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveCustomSub(); } }} />
                  <AnimatedButton type="button" size="sm" onClick={saveCustomSub} disabled={!newSub.trim()} aria-label="Save subcategory"><Check className="size-4" /></AnimatedButton>
                  <AnimatedButton type="button" size="sm" variant="ghost" onClick={resetSubAdd} aria-label="Cancel"><X className="size-4" /></AnimatedButton>
                </div>
              ) : (
                <button type="button" onClick={() => setAddingSub(true)} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-gold-600)] hover:underline">
                  <Plus className="size-3.5" /> New subcategory
                </button>
              )}
            </div>
          )}
          {activeAccounts.length > 0 && (
            <Select label="Account (optional)" value={accountId}
              onChange={(e) => { const next = e.target.value; setAccountId(next); const acc = activeAccounts.find((a) => a.id === next); if (acc) setCurrency(acc.currency); }}
              options={[{ value: "", label: "Unassigned" }, ...activeAccounts.map((a) => ({ value: a.id, label: `${a.name} (${a.currency})` }))]} />
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Select label="Currency" value={effCurrency} onChange={(e) => setCurrency(e.target.value)} disabled={!!selectedAccount} options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
          </div>
        </div>
      )}

      <div className="mt-1 flex items-center justify-end gap-3">
        <AnimatedButton type="button" variant="ghost" onClick={onCancel} disabled={submitting}>Cancel</AnimatedButton>
        <AnimatedButton type="submit" loading={submitting}>{initial ? "Save changes" : "Add transaction"}</AnimatedButton>
      </div>
    </form>
  );
}
