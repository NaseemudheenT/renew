"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Pencil, Trash2, RefreshCw, XCircle, PlayCircle } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { AnimatedButton, AnimatedModal } from "@/components/motion";
import { RowMenu } from "@/components/ui/RowMenu";
import { SwipeRow } from "@/components/ui/SwipeRow";
import { AnimatedAmount } from "@/components/finance/AnimatedAmount";
import { RecurringSuggestions } from "@/components/finance/RecurringSuggestions";
import { toast } from "@/components/ui/toast-store";
import { useScopedUserCollection } from "@/hooks/useScopedUserCollection";
import { useLocale } from "@/components/providers/LocaleProvider";
import { formatAmountTyping, parseAmount, groupingLocale, displayFromValue } from "@/lib/amount-format";
import {
  createSubscription, updateSubscription, setSubscriptionStatus, deleteSubscription, restoreSubscription, type SubscriptionInput,
} from "@/lib/firestore/subscriptions";
import { BILLING_CYCLES, subscriptionMonthly, subscriptionTotals, advanceBilling } from "@/lib/accounts";
import { CATEGORIES, categoryMeta } from "@/lib/categories";
import { toDateInput, fromDateTimeInputs, todayStart } from "@/lib/dates";
import { CURRENCIES } from "@/lib/utils";
import type { Subscription, Account, BillingCycle, Category } from "@/lib/types";

export function SubscriptionsView() {
  const { prefs, money, t, dueLabel } = useLocale();
  const { data: subs, loading, uid } = useScopedUserCollection<Subscription>("subscriptions");
  const { data: accounts } = useScopedUserCollection<Account>("accounts");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);

  const active = subs.filter((s) => s.status === "active");
  const cancelled = subs.filter((s) => s.status === "cancelled");

  function removeSub(s: Subscription) {
    if (!uid) return;
    deleteSubscription(uid, s.id)
      .then(() => toast({ title: "Subscription deleted", action: { label: "Undo", onClick: () => restoreSubscription(uid, s).catch(() => {}) } }))
      .catch(() => toast({ title: "Couldn't delete", variant: "error" }));
  }

  // Keep active subscriptions' next-billing dates current: if one has passed,
  // roll it forward by whole cycles to the next future date (they auto-renew).
  const advancing = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!uid) return;
    const start = todayStart();
    for (const s of active) {
      if (s.nextBillingAt >= start || advancing.current.has(s.id)) continue;
      let next = s.nextBillingAt;
      for (let guard = 0; next < start && guard < 600; guard++) next = advanceBilling(next, s.cycle);
      if (next !== s.nextBillingAt) {
        advancing.current.add(s.id);
        updateSubscription(uid, s.id, { nextBillingAt: next })
          .catch(() => {})
          .finally(() => advancing.current.delete(s.id));
      }
    }
  }, [active, uid]);

  // Per-currency monthly/annual totals — currencies are never summed together.
  const totals = useMemo(() => {
    const currencies = Array.from(new Set(active.map((s) => s.currency)));
    return currencies.map((cur) => ({ cur, ...subscriptionTotals(active, cur) }));
  }, [active]);

  const isEmpty = !loading && subs.length === 0;

  /** Renew tracks subscriptions — it never charges. Marking one renewed rolls it
   *  to the next billing date so the tracking stays accurate. */
  async function onPay(sub: Subscription) {
    if (!uid) return;
    const next = advanceBilling(sub.nextBillingAt, sub.cycle);
    await updateSubscription(uid, sub.id, { nextBillingAt: next }).catch(() => {});
    toast({ title: "Marked renewed", description: `Next ${dueLabel(next)}`, variant: "success" });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={t("nav.subscriptions")}
        subtitle="Every recurring service, and what it really costs you."
        action={<AnimatedButton onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="size-4" />{t("subs.new")}</AnimatedButton>}
      />

      {!loading && (
        <div className="mb-4">
          <RecurringSuggestions subscriptions={subs} />
        </div>
      )}

      {loading ? (
        <ListSkeleton />
      ) : isEmpty ? (
        <GlassCard padded>
          <EmptyState icon={RefreshCw} title={t("subs.empty.title")} description={t("subs.empty.body")} action={<AnimatedButton onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="size-4" />{t("subs.new")}</AnimatedButton>} />
        </GlassCard>
      ) : (
        <>
          {totals.length > 0 && (
            <GlassCard padded className="mb-4">
              <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                {totals.map(({ cur, monthly, annual }) => (
                  <div key={cur} className="flex items-baseline gap-4">
                    <div><p className="text-muted text-xs">{t("subs.monthly")}</p><p className="text-strong text-2xl font-light tabular-nums"><AnimatedAmount value={monthly} currency={cur} /></p></div>
                    <div><p className="text-muted text-xs">{t("subs.annual")}</p><p className="text-body text-lg font-medium tabular-nums"><AnimatedAmount value={annual} currency={cur} /></p></div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          <div className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {active.map((s) => (
                <SubRow key={s.id} sub={s} money={money} dueLabel={dueLabel} cycleLabel={t(cycleKey(s.cycle))}
                  onPay={() => onPay(s)}
                  onEdit={() => { setEditing(s); setModalOpen(true); }}
                  onCancel={() => uid && setSubscriptionStatus(uid, s.id, "cancelled")}
                  onDelete={() => removeSub(s)} />
              ))}
            </AnimatePresence>
          </div>

          {cancelled.length > 0 && (
            <div className="mt-5">
              <button type="button" onClick={() => setShowCancelled((v) => !v)} className="text-muted mb-2 text-xs font-medium hover:text-[var(--text-strong)]">
                {showCancelled ? "▾" : "▸"} {t("subs.cancelled")} ({cancelled.length})
              </button>
              {showCancelled && (
                <div className="flex flex-col gap-2 opacity-70">
                  {cancelled.map((s) => (
                    <SubRow key={s.id} sub={s} money={money} dueLabel={dueLabel} cycleLabel={t(cycleKey(s.cycle))} cancelled
                      onReactivate={() => uid && setSubscriptionStatus(uid, s.id, "active")}
                      onDelete={() => removeSub(s)} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <SubModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} uid={uid} editing={editing} accounts={accounts} defaultCurrency={prefs.currency} />
    </div>
  );
}

function cycleKey(c: BillingCycle) {
  return `subs.cycle.${c}` as const;
}

function SubRow({ sub, money, dueLabel, cycleLabel, cancelled, onPay, onEdit, onCancel, onReactivate, onDelete }: {
  sub: Subscription;
  money: (n: number, c?: string) => string;
  dueLabel: (v: number, hasTime?: boolean) => string;
  cycleLabel: string;
  cancelled?: boolean;
  onPay?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
  onReactivate?: () => void;
  onDelete: () => void;
}) {
  const meta = categoryMeta(sub.category as Category);
  const Icon = meta.icon;
  const items = cancelled
    ? [{ label: "Reactivate", icon: PlayCircle, onClick: onReactivate! }, { label: "Delete", icon: Trash2, onClick: onDelete, danger: true }]
    : [{ label: "Mark renewed", icon: RefreshCw, onClick: onPay! }, { label: "Edit", icon: Pencil, onClick: onEdit! }, { label: "Cancel", icon: XCircle, onClick: onCancel! }, { label: "Delete", icon: Trash2, onClick: onDelete, danger: true }];
  return (
    <motion.div layout="position" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}>
      <SwipeRow
        swipeRight={cancelled || !onPay ? undefined : { label: "Renewed", icon: RefreshCw, bg: "bg-emerald-500", onTrigger: onPay }}
        swipeLeft={
          cancelled
            ? { label: "Delete", icon: Trash2, bg: "bg-rose-500", onTrigger: onDelete }
            : onCancel
              ? { label: "Cancel", icon: XCircle, bg: "bg-amber-500", onTrigger: onCancel }
              : undefined
        }
      >
        <div className="glass flex items-center gap-3 p-3.5">
          <span className="glass grid size-10 shrink-0 place-items-center !rounded-2xl"><Icon className="size-5 text-[var(--color-gold-500)]" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-strong truncate text-sm font-medium">{sub.name}</p>
            <p className="text-muted truncate text-xs">{cycleLabel}{cancelled ? "" : ` · ${dueLabel(sub.nextBillingAt)}`}</p>
          </div>
          <div className="text-end">
            <p className="text-strong text-sm font-medium tabular-nums">{money(sub.price, sub.currency)}</p>
            <p className="text-muted text-xs tabular-nums">≈ {money(subscriptionMonthly(sub), sub.currency)}/mo</p>
          </div>
          <RowMenu items={items} />
        </div>
      </SwipeRow>
    </motion.div>
  );
}

function SubModal({ open, onClose, uid, editing, accounts, defaultCurrency }: { open: boolean; onClose: () => void; uid: string | null; editing: Subscription | null; accounts: Account[]; defaultCurrency: string }) {
  const { t, prefs } = useLocale();
  const [todayStr] = useState(() => toDateInput(Date.now()));
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [nextAt, setNextAt] = useState(todayStr);
  const [category, setCategory] = useState<Category>("subscriptions");
  const [accountId, setAccountId] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [initId, setInitId] = useState<string | null>(null);

  if (!open && initId !== null) setInitId(null);
  if (open && editing && initId !== editing.id) { setInitId(editing.id); setName(editing.name); setPrice(displayFromValue(editing.price, groupingLocale(prefs.region, editing.currency))); setCurrency(editing.currency); setCycle(editing.cycle); setNextAt(toDateInput(editing.nextBillingAt)); setCategory(editing.category as Category); setAccountId(editing.accountId ?? ""); setNotes(editing.notes ?? ""); }
  if (open && !editing && initId !== "new") { setInitId("new"); setName(""); setPrice(""); setCurrency(defaultCurrency); setCycle("monthly"); setNextAt(todayStr); setCategory("subscriptions"); setAccountId(""); setNotes(""); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!uid || !name.trim()) return;
    const p = parseAmount(price);
    if (!Number.isFinite(p) || p < 0) return;
    setSubmitting(true);
    try {
      const input: SubscriptionInput = { name: name.trim(), price: p, currency, cycle, nextBillingAt: fromDateTimeInputs(nextAt), category, accountId: accountId || undefined, notes: notes.trim() || undefined };
      if (editing) await updateSubscription(uid, editing.id, input);
      else await createSubscription(uid, input);
      toast({ title: editing ? t("subs.updated") : t("subs.created"), variant: "success" });
      setInitId(null);
      onClose();
    } catch {
      toast({ title: t("common.error"), variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatedModal open={open} onClose={onClose} title={editing ? t("subs.edit") : t("subs.new")}>
      <form onSubmit={save} className="flex flex-col gap-4">
        <Input label={t("subs.name")} value={name} autoFocus onChange={(e) => setName(e.target.value)} placeholder="e.g. Netflix" />
        <div className="grid grid-cols-2 gap-3">
          <Input label={t("subs.price")} type="text" inputMode="decimal" value={price} onChange={(e) => setPrice(formatAmountTyping(e.target.value, groupingLocale(prefs.region, currency)).display)} placeholder="0" />
          <Select label={t("settings.region.currency")} value={currency} onChange={(e) => setCurrency(e.target.value)} options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select label={t("subs.cycle")} value={cycle} onChange={(e) => setCycle(e.target.value as BillingCycle)} options={BILLING_CYCLES.map((c) => ({ value: c.value, label: t(cycleKey(c.value)) }))} />
          <Input label={t("subs.next")} type="date" value={nextAt} onChange={(e) => setNextAt(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select label={t("common.category")} value={category} onChange={(e) => setCategory(e.target.value as Category)} options={CATEGORIES.map((c) => ({ value: c.id, label: c.label }))} />
          <Select label={t("subs.account")} value={accountId} onChange={(e) => setAccountId(e.target.value)} options={[{ value: "", label: "—" }, ...accounts.filter((a) => a.status === "active").map((a) => ({ value: a.id, label: a.name }))]} />
        </div>
        <Textarea label={t("accounts.note")} value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Optional" />
        <div className="mt-1 flex items-center justify-end gap-3">
          <AnimatedButton type="button" variant="ghost" onClick={onClose} disabled={submitting}>{t("common.cancel")}</AnimatedButton>
          <AnimatedButton type="submit" loading={submitting}>{editing ? t("common.save") : t("subs.new")}</AnimatedButton>
        </div>
      </form>
    </AnimatedModal>
  );
}
