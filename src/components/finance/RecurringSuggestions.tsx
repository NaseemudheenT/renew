"use client";

import { useMemo, useState } from "react";
import { Sparkles, Plus, X } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedButton } from "@/components/motion";
import { toast } from "@/components/ui/toast-store";
import { useScopedUserCollection } from "@/hooks/useScopedUserCollection";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useCategories } from "@/hooks/useCategories";
import { detectRecurring, matchesTracked, type RecurringCandidate } from "@/lib/recurring";
import { createSubscription } from "@/lib/firestore/subscriptions";
import { ignoreRecurring } from "@/lib/firestore/profile";
import { billingCycleMeta } from "@/lib/accounts";
import type { Transaction, Subscription } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Phase 2 intelligence, surfaced: Renew scans the person's own transactions,
 * finds steady recurring payments they aren't tracking yet, and offers to track
 * them (one tap → a subscription). Suggestions only — the person always confirms.
 */
export function RecurringSuggestions({ subscriptions }: { subscriptions: Subscription[] }) {
  const { data: txs, uid } = useScopedUserCollection<Transaction>("transactions");
  const { profile } = useUserProfile();
  const { money, shortDate } = useLocale();
  const { resolve } = useCategories();
  const [busy, setBusy] = useState<string | null>(null);
  const [hidden, setHidden] = useState<string[]>([]);

  const candidates = useMemo(() => {
    const tracked = subscriptions.map((s) => ({ name: s.name, price: s.price }));
    const ignored = profile?.ignoredRecurring ?? [];
    return detectRecurring(txs)
      .filter((c) => c.type === "expense")
      .filter((c) => !matchesTracked(c, tracked))
      .filter((c) => !ignored.includes(c.key) && !hidden.includes(c.key))
      .slice(0, 5);
  }, [txs, subscriptions, profile?.ignoredRecurring, hidden]);

  if (candidates.length === 0) return null;

  async function track(c: RecurringCandidate) {
    if (!uid) return;
    setBusy(c.key);
    try {
      await createSubscription(uid, {
        name: c.name,
        price: c.amount,
        currency: c.currency,
        cycle: c.cycle,
        nextBillingAt: c.nextAt,
        category: c.category,
      });
      setHidden((h) => [...h, c.key]);
      toast({ title: `Now tracking ${c.name}`, variant: "success" });
    } catch {
      toast({ title: "Couldn't track it — try again", variant: "error" });
    } finally {
      setBusy(null);
    }
  }
  function dismiss(c: RecurringCandidate) {
    if (!uid) return;
    setHidden((h) => [...h, c.key]);
    ignoreRecurring(uid, c.key).catch(() => {});
  }

  return (
    <GlassCard padded>
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-xl bg-[var(--glass-bg-strong)]"><Sparkles className="size-4 text-[var(--color-gold-500)]" /></span>
        <div>
          <h2 className="text-strong text-sm font-medium">Recurring we spotted</h2>
          <p className="text-muted text-xs">Regular payments in your transactions — track them and Renew watches the renewals.</p>
        </div>
      </div>
      <ul className="mt-4 flex flex-col gap-2">
        {candidates.map((c) => {
          const meta = resolve(c.category);
          const Icon = meta.icon;
          const cyc = billingCycleMeta(c.cycle);
          return (
            <li key={c.key} className="flex items-center gap-3 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-2.5">
              <Icon className="size-4 shrink-0 text-[var(--color-gold-500)]" />
              <div className="min-w-0 flex-1">
                <p className="text-strong truncate text-sm font-medium">{c.name}</p>
                <p className="text-muted truncate text-xs">
                  {money(c.amount, c.currency)} · {cyc.label} · next {shortDate(c.nextAt)}
                </p>
              </div>
              <AnimatedButton size="sm" onClick={() => track(c)} loading={busy === c.key} disabled={busy !== null}>
                <Plus className="size-3.5" />Track
              </AnimatedButton>
              <button
                type="button"
                onClick={() => dismiss(c)}
                aria-label={`Dismiss ${c.name}`}
                className={cn("grid size-8 shrink-0 place-items-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--glass-bg-strong)] hover:text-[var(--text-strong)]", busy !== null && "pointer-events-none opacity-50")}
              >
                <X className="size-4" />
              </button>
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}
