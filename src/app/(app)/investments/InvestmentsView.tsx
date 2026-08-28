"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, TrendingUp, Pencil, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { AnimatedButton, AnimatedModal } from "@/components/motion";
import { RowMenu } from "@/components/ui/RowMenu";
import { AnimatedAmount } from "@/components/finance/AnimatedAmount";
import { toast } from "@/components/ui/toast-store";
import { useScopedUserCollection } from "@/hooks/useScopedUserCollection";
import { createInvestment, updateInvestment, deleteInvestment } from "@/lib/firestore/investments";
import { INVESTMENT_TYPES, investmentMeta } from "@/lib/finance";
import { useLocale } from "@/components/providers/LocaleProvider";
import { formatAmountTyping, parseAmount, groupingLocale, displayFromValue } from "@/lib/amount-format";
import { CURRENCIES, cn } from "@/lib/utils";
import type { Investment, InvestmentType } from "@/lib/types";

export function InvestmentsView() {
  const { prefs, money, t } = useLocale();
  const { data, loading, uid } = useScopedUserCollection<Investment>("investments");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Investment | null>(null);

  const totals = useMemo(() => {
    let value = 0, cost = 0;
    for (const i of data) { value += i.quantity * i.currentPrice; cost += i.quantity * i.buyPrice; }
    return { value, cost, gain: value - cost };
  }, [data]);
  const currency = data[0]?.currency ?? prefs.currency;
  const isEmpty = !loading && data.length === 0;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("nav.investments")} subtitle="Track what you hold and how it's doing." action={<AnimatedButton onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="size-4" />Add holding</AnimatedButton>} />
      {loading ? (
        <ListSkeleton />
      ) : isEmpty ? (
        <GlassCard padded><EmptyState icon={TrendingUp} title="No investments tracked" description="Add a stock, fund or crypto holding with its quantity and prices — Renew shows your value and gain." action={<AnimatedButton onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="size-4" />Add holding</AnimatedButton>} /></GlassCard>
      ) : (
        <>
          <GlassCard padded className="mb-4">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
              <div><p className="text-muted text-xs">Portfolio value</p><p className="text-strong text-2xl font-light tabular-nums"><AnimatedAmount value={totals.value} currency={currency} /></p></div>
              <div><p className="text-muted text-xs">Invested</p><p className="text-body text-xl font-medium tabular-nums"><AnimatedAmount value={totals.cost} currency={currency} /></p></div>
              <div><p className="text-muted text-xs">Gain / loss</p><p className={cn("text-xl font-medium tabular-nums", totals.gain >= 0 ? "text-emerald-500" : "text-rose-500")}><AnimatedAmount value={totals.gain} currency={currency} signed /></p></div>
            </div>
          </GlassCard>
          <div className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {data.map((i) => {
                const meta = investmentMeta(i.itype);
                const Icon = meta.icon;
                const value = i.quantity * i.currentPrice;
                const gain = value - i.quantity * i.buyPrice;
                return (
                  <motion.div key={i.id} layout="position" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="glass flex items-center gap-3 p-3.5">
                    <span className="glass grid size-10 shrink-0 place-items-center !rounded-2xl"><Icon className="size-5 text-[var(--color-gold-500)]" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-strong truncate text-sm font-medium">{i.name}</p>
                      <p className="text-muted text-xs tabular-nums">{i.quantity} · {meta.label}</p>
                    </div>
                    <div className="text-end">
                      <p className="text-strong text-sm font-medium tabular-nums">{money(value, i.currency)}</p>
                      <p className={cn("text-xs tabular-nums", gain >= 0 ? "text-emerald-500" : "text-rose-500")}>{gain >= 0 ? "+" : "−"}{money(Math.abs(gain), i.currency)}</p>
                    </div>
                    <RowMenu items={[{ label: "Edit", icon: Pencil, onClick: () => { setEditing(i); setModalOpen(true); } }, { label: "Delete", icon: Trash2, onClick: () => uid && deleteInvestment(uid, i.id), danger: true }]} />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </>
      )}
      <HoldingModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} uid={uid} editing={editing} />
    </div>
  );
}

function HoldingModal({ open, onClose, uid, editing }: { open: boolean; onClose: () => void; uid: string | null; editing: Investment | null }) {
  const { prefs } = useLocale();
  const [name, setName] = useState("");
  const [itype, setItype] = useState<InvestmentType>("stock");
  const [quantity, setQuantity] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [currency, setCurrency] = useState(prefs.currency);
  const [submitting, setSubmitting] = useState(false);
  const [initId, setInitId] = useState<string | null>(null);

  if (open && editing && initId !== editing.id) { setInitId(editing.id); setName(editing.name); setItype(editing.itype); setQuantity(String(editing.quantity)); setBuyPrice(displayFromValue(editing.buyPrice, groupingLocale(prefs.region, editing.currency))); setCurrentPrice(displayFromValue(editing.currentPrice, groupingLocale(prefs.region, editing.currency))); setCurrency(editing.currency); }
  if (open && !editing && initId !== "new") { setInitId("new"); setName(""); setItype("stock"); setQuantity(""); setBuyPrice(""); setCurrentPrice(""); setCurrency(prefs.currency); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!uid || !name.trim()) return;
    const q = Number(quantity), bp = parseAmount(buyPrice), cp = parseAmount(currentPrice);
    if (q <= 0 || bp < 0 || cp < 0) return;
    setSubmitting(true);
    try {
      const payload = { name: name.trim(), itype, quantity: q, buyPrice: bp, currentPrice: cp, currency };
      if (editing) await updateInvestment(uid, editing.id, payload);
      else await createInvestment(uid, payload);
      toast({ title: editing ? "Holding updated" : "Holding added", variant: "success" });
      setInitId(null);
      onClose();
    } catch {
      toast({ title: "Something went wrong", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatedModal open={open} onClose={() => { setInitId(null); onClose(); }} title={editing ? "Edit holding" : "Add holding"}>
      <form onSubmit={save} className="flex flex-col gap-4">
        <Input label="Name" placeholder="e.g. Apple, Bitcoin, Nifty 50" value={name} autoFocus onChange={(e) => setName(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Type" value={itype} onChange={(e) => setItype(e.target.value as InvestmentType)} options={INVESTMENT_TYPES.map((t) => ({ value: t.value, label: t.label }))} />
          <Input label="Quantity" type="number" min="0" step="any" placeholder="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
        <div className="grid grid-cols-[1fr_1fr_6rem] gap-3">
          <Input label="Buy price" type="text" inputMode="decimal" placeholder="0" value={buyPrice} onChange={(e) => setBuyPrice(formatAmountTyping(e.target.value, groupingLocale(prefs.region, currency)).display)} />
          <Input label="Current price" type="text" inputMode="decimal" placeholder="0" value={currentPrice} onChange={(e) => setCurrentPrice(formatAmountTyping(e.target.value, groupingLocale(prefs.region, currency)).display)} />
          <Select label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
        </div>
        <div className="mt-1 flex items-center justify-end gap-3">
          <AnimatedButton type="button" variant="ghost" onClick={() => { setInitId(null); onClose(); }} disabled={submitting}>Cancel</AnimatedButton>
          <AnimatedButton type="submit" loading={submitting}>{editing ? "Save" : "Add"}</AnimatedButton>
        </div>
      </form>
    </AnimatedModal>
  );
}
