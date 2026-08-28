"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, ShieldCheck, X, Trash2, ArrowRight } from "lucide-react";
import { RenewMark } from "@/components/brand/RenewMark";
import { Wordmark } from "@/components/brand/Wordmark";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { AnimatedButton } from "@/components/motion";
import { categoriesFor } from "@/lib/finance";
import { detectGuestCurrency, getGuestTxns, addGuestTxn, deleteGuestTxn, type GuestTxn } from "@/lib/guest";

const EXPENSE_CATS = categoriesFor("expense");

function useGuestTxns(): GuestTxn[] {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("renew-guest-change", cb);
      window.addEventListener("storage", cb);
      return () => {
        window.removeEventListener("renew-guest-change", cb);
        window.removeEventListener("storage", cb);
      };
    },
    getGuestTxns,
    getGuestTxns,
  );
}

/**
 * The setup page: log a first expense in seconds — no sign-in, no currency
 * question, no account question. Currency is auto-detected from the phone;
 * entries are kept on the device and moved into the account after sign-in.
 */
export function StartView() {
  // Detect after mount so server and first client render match (no hydration
  // mismatch); the phone's currency fills in immediately on the client.
  const [currency, setCurrency] = useState("USD");
  useEffect(() => setCurrency(detectGuestCurrency()), []);
  const txns = useGuestTxns();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATS[0]!.id);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [promptDismissed, setPromptDismissed] = useState(false);

  function labelFor(id: string) {
    return EXPENSE_CATS.find((c) => c.id === id)?.label ?? id;
  }

  function save() {
    const amt = Number(amount);
    if (!amount || Number.isNaN(amt) || amt <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    addGuestTxn({ type: "expense", amount: amt, currency, category, note: note.trim() || undefined, date: Date.now() });
    setAmount("");
    setNote("");
    setError(null);
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center py-10">
      <Link href="/" className="mb-6 flex items-center gap-3 self-center" aria-label="Renew home">
        <RenewMark size={30} />
        <Wordmark sizeClassName="text-lg" />
      </Link>

      <GlassCard padded>
        <h1 className="text-strong text-2xl font-medium tracking-tight">Add your first expense</h1>
        <p className="text-muted mt-1 mb-5 text-sm">No sign-in needed. Just log it — we&apos;ll keep it safe.</p>

        <div className="flex flex-col gap-3">
          <Input label="Amount" type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00" value={amount} autoFocus onChange={(e) => setAmount(e.target.value)} error={error ?? undefined} hint={`Currency: ${currency}`} />
          <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)} options={EXPENSE_CATS.map((c) => ({ value: c.id, label: c.label }))} />
          <Input label="Note (optional)" placeholder="e.g. Lunch" value={note} onChange={(e) => setNote(e.target.value)} />
          <AnimatedButton size="lg" onClick={save}><Plus className="size-4" />Add expense</AnimatedButton>
        </div>

        {txns.length > 0 && (
          <ul className="mt-5 flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {txns.map((t) => (
                <motion.li key={t.id} layout="position" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -16, transition: { duration: 0.18 } }}
                  className="flex items-center gap-3 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-2.5">
                  <span className="text-body min-w-0 flex-1 truncate text-sm">{t.note || labelFor(t.category)}</span>
                  <span className="text-strong text-sm font-medium tabular-nums">{t.currency} {t.amount.toLocaleString()}</span>
                  <button type="button" onClick={() => deleteGuestTxn(t.id)} aria-label="Remove" className="text-[var(--text-muted)] transition-colors hover:text-rose-500"><Trash2 className="size-4" /></button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </GlassCard>

      {/* Soft, dismissible sign-in prompt — only after they've logged something. */}
      <AnimatePresence>
        {txns.length > 0 && !promptDismissed && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="glass mt-4 flex items-center gap-3 p-4">
            <ShieldCheck className="size-5 shrink-0 text-[var(--color-gold-500)]" />
            <div className="min-w-0 flex-1">
              <p className="text-strong text-sm font-medium">Keep your data safe</p>
              <p className="text-muted text-xs">Sign in to save your entries to your account.</p>
            </div>
            <Link href="/sign-up"><AnimatedButton size="sm">Sign in<ArrowRight className="size-4" /></AnimatedButton></Link>
            <button type="button" onClick={() => setPromptDismissed(true)} aria-label="Dismiss" className="text-[var(--text-muted)] transition-colors hover:text-[var(--text-strong)]"><X className="size-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-muted mt-5 text-center text-sm">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-[var(--color-gold-600)] hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
