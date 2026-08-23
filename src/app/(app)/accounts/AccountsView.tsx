"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Pencil, Trash2, Archive, ArchiveRestore, ArrowLeftRight, ArrowRight, Wallet } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { AnimatedButton, AnimatedModal } from "@/components/motion";
import { RowMenu } from "@/components/ui/RowMenu";
import { AnimatedAmount } from "@/components/finance/AnimatedAmount";
import { toast } from "@/components/ui/toast-store";
import { useUserCollection } from "@/hooks/useUserCollection";
import { useLocale } from "@/components/providers/LocaleProvider";
import { createAccount, updateAccount, setAccountStatus, deleteAccount, type AccountInput } from "@/lib/firestore/accounts";
import { createTransfer, deleteTransfer, type TransferInput } from "@/lib/firestore/transfers";
import { ACCOUNT_TYPES, accountTypeMeta, computeAccountBalance } from "@/lib/accounts";
import { usePrivacy } from "@/components/providers/PrivacyProvider";
import { toDateInput, fromDateTimeInputs } from "@/lib/dates";
import { CURRENCIES, cn } from "@/lib/utils";
import type { Account, AccountType, Transaction, Transfer } from "@/lib/types";

export function AccountsView() {
  const { prefs, money, t, shortDate } = useLocale();
  const { data: accounts, loading, uid } = useUserCollection<Account>("accounts");
  const { data: txs } = useUserCollection<Transaction>("transactions");
  const { data: transfers } = useUserCollection<Transfer>("transfers");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Account | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const active = accounts.filter((a) => a.status === "active");
  const archived = accounts.filter((a) => a.status === "archived");
  const balances = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of accounts) m.set(a.id, computeAccountBalance(a, txs, transfers));
    return m;
  }, [accounts, txs, transfers]);

  // Per-currency totals of active accounts — never mix currencies into one sum.
  const currencyTotals = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of active) m.set(a.currency, (m.get(a.currency) ?? 0) + (balances.get(a.id) ?? 0));
    return Array.from(m.entries());
  }, [active, balances]);

  const isEmpty = !loading && accounts.length === 0;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={t("nav.accounts")}
        subtitle="Every place your money lives — balances update from your activity."
        action={
          <div className="flex items-center gap-2">
            {active.length >= 2 && (
              <AnimatedButton variant="glass" onClick={() => setTransferOpen(true)}>
                <ArrowLeftRight className="size-4" />{t("accounts.transfer")}
              </AnimatedButton>
            )}
            <AnimatedButton onClick={() => { setEditing(null); setModalOpen(true); }}>
              <Plus className="size-4" />{t("accounts.new")}
            </AnimatedButton>
          </div>
        }
      />

      {loading ? (
        <ListSkeleton />
      ) : isEmpty ? (
        <GlassCard padded>
          <EmptyState icon={Wallet} title="No accounts yet" description="Add the accounts your money lives in — bank, cash, credit card, wallet — so Renew can organise where everything belongs. Renew only tracks; it never connects to or moves your money." action={<AnimatedButton onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="size-4" />{t("accounts.new")}</AnimatedButton>} />
        </GlassCard>
      ) : (
        <>
          {currencyTotals.length > 0 && (
            <GlassCard padded className="mb-4">
              <p className="text-muted text-xs">{t("accounts.total")}</p>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-6 gap-y-1">
                {currencyTotals.map(([cur, total]) => (
                  <AnimatedAmount key={cur} value={total} currency={cur} className="text-strong text-2xl font-light tabular-nums" />
                ))}
              </div>
            </GlassCard>
          )}

          <div className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {active.map((a) => (
                <AccountRow key={a.id} account={a} balance={balances.get(a.id) ?? 0} money={money}
                  onEdit={() => { setEditing(a); setModalOpen(true); }}
                  onArchive={() => uid && setAccountStatus(uid, a.id, "archived")}
                  onDelete={() => setConfirmDelete(a)} />
              ))}
            </AnimatePresence>
          </div>

          {archived.length > 0 && (
            <div className="mt-5">
              <button type="button" onClick={() => setShowArchived((v) => !v)} className="text-muted mb-2 text-xs font-medium hover:text-[var(--text-strong)]">
                {showArchived ? "▾" : "▸"} {t("accounts.archived")} ({archived.length})
              </button>
              {showArchived && (
                <div className="flex flex-col gap-2 opacity-70">
                  {archived.map((a) => (
                    <AccountRow key={a.id} account={a} balance={balances.get(a.id) ?? 0} money={money} archived
                      onRestore={() => uid && setAccountStatus(uid, a.id, "active")}
                      onDelete={() => setConfirmDelete(a)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {transfers.length > 0 && (
            <GlassCard padded className="mt-5">
              <h2 className="text-strong mb-3 text-sm font-medium">{t("accounts.recentTransfers")}</h2>
              <ul className="flex flex-col gap-2">
                {[...transfers].sort((a, b) => b.date - a.date).slice(0, 6).map((tr) => {
                  const from = accounts.find((a) => a.id === tr.fromAccountId);
                  const to = accounts.find((a) => a.id === tr.toAccountId);
                  return (
                    <li key={tr.id} className="flex items-center gap-3 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-2.5 text-sm">
                      <ArrowLeftRight className="size-4 shrink-0 text-[var(--color-gold-500)]" />
                      <span className="text-body flex min-w-0 flex-1 items-center gap-1.5 truncate">
                        {from?.name ?? "—"} <ArrowRight className="size-3 shrink-0 text-[var(--text-muted)]" /> {to?.name ?? "—"}
                      </span>
                      <span className="text-muted shrink-0 text-xs">{shortDate(tr.date)}</span>
                      <span className="text-strong shrink-0 font-medium tabular-nums">{money(tr.amount, tr.currency)}</span>
                      {uid && <RowMenu items={[{ label: t("common.delete"), icon: Trash2, onClick: () => deleteTransfer(uid, tr.id), danger: true }]} />}
                    </li>
                  );
                })}
              </ul>
            </GlassCard>
          )}
        </>
      )}

      <AccountModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} uid={uid} editing={editing} defaultCurrency={prefs.currency} />
      <TransferModal open={transferOpen} onClose={() => setTransferOpen(false)} uid={uid} accounts={active} />
      <AnimatedModal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title={t("accounts.delete.title")}
        description={t("accounts.delete.body")}
      >
        <div className="flex items-center justify-end gap-3">
          <AnimatedButton variant="ghost" onClick={() => setConfirmDelete(null)}>{t("common.cancel")}</AnimatedButton>
          <AnimatedButton variant="danger" onClick={async () => {
            if (uid && confirmDelete) { await deleteAccount(uid, confirmDelete.id); toast({ title: t("accounts.deleted") }); }
            setConfirmDelete(null);
          }}><Trash2 className="size-4" />{t("common.delete")}</AnimatedButton>
        </div>
      </AnimatedModal>
    </div>
  );
}

function AccountRow({ account, balance, money, archived, onEdit, onArchive, onRestore, onDelete }: {
  account: Account;
  balance: number;
  money: (n: number, c?: string) => string;
  archived?: boolean;
  onEdit?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onDelete: () => void;
}) {
  const { hidden, mask } = usePrivacy();
  const meta = accountTypeMeta(account.atype);
  const Icon = meta.icon;
  const negative = balance < 0;
  const items = archived
    ? [{ label: "Restore", icon: ArchiveRestore, onClick: onRestore! }, { label: "Delete", icon: Trash2, onClick: onDelete, danger: true }]
    : [{ label: "Edit", icon: Pencil, onClick: onEdit! }, { label: "Archive", icon: Archive, onClick: onArchive! }, { label: "Delete", icon: Trash2, onClick: onDelete, danger: true }];
  return (
    <motion.div layout="position" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="glass flex items-center gap-3 p-3.5">
      <span className="glass grid size-10 shrink-0 place-items-center !rounded-2xl"><Icon className="size-5 text-[var(--color-gold-500)]" /></span>
      <div className="min-w-0 flex-1">
        <p className="text-strong truncate text-sm font-medium">{account.name}</p>
        <p className="text-muted truncate text-xs">{account.institution ? `${account.institution} · ` : ""}{meta.label}</p>
      </div>
      <span className={cn("shrink-0 text-sm font-semibold tabular-nums", negative ? "text-rose-500" : "text-[var(--text-strong)]")}>{hidden ? mask : money(balance, account.currency)}</span>
      <RowMenu items={items} />
    </motion.div>
  );
}

function AccountModal({ open, onClose, uid, editing, defaultCurrency }: { open: boolean; onClose: () => void; uid: string | null; editing: Account | null; defaultCurrency: string }) {
  const { t } = useLocale();
  const [name, setName] = useState("");
  const [atype, setAtype] = useState<AccountType>("bank");
  const [institution, setInstitution] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [opening, setOpening] = useState("0");
  const [submitting, setSubmitting] = useState(false);
  const [initId, setInitId] = useState<string | null>(null);

  if (!open && initId !== null) setInitId(null);
  if (open && editing && initId !== editing.id) { setInitId(editing.id); setName(editing.name); setAtype(editing.atype); setInstitution(editing.institution ?? ""); setCurrency(editing.currency); setOpening(String(editing.openingBalance)); }
  if (open && !editing && initId !== "new") { setInitId("new"); setName(""); setAtype("bank"); setInstitution(""); setCurrency(defaultCurrency); setOpening("0"); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!uid || !name.trim()) return;
    const opened = Number(opening);
    if (!Number.isFinite(opened)) return;
    setSubmitting(true);
    try {
      const input: AccountInput = { name: name.trim(), atype, institution: institution.trim() || undefined, currency, openingBalance: opened };
      if (editing) await updateAccount(uid, editing.id, input);
      else await createAccount(uid, input);
      toast({ title: editing ? t("accounts.updated") : t("accounts.created"), variant: "success" });
      setInitId(null);
      onClose();
    } catch {
      toast({ title: t("common.error"), variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatedModal open={open} onClose={onClose} title={editing ? t("accounts.edit") : t("accounts.new")}>
      <form onSubmit={save} className="flex flex-col gap-4">
        <Input label={t("accounts.name")} value={name} autoFocus onChange={(e) => setName(e.target.value)} placeholder="e.g. Everyday checking" />
        <div className="grid grid-cols-2 gap-3">
          <Select label={t("accounts.type")} value={atype} onChange={(e) => setAtype(e.target.value as AccountType)} options={ACCOUNT_TYPES.map((a) => ({ value: a.value, label: a.label }))} />
          <Select label={t("settings.region.currency")} value={currency} onChange={(e) => setCurrency(e.target.value)} options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
        </div>
        <Input label={t("accounts.institution")} value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Optional" />
        <Input label={t("accounts.opening")} type="number" inputMode="decimal" step="0.01" value={opening} onChange={(e) => setOpening(e.target.value)} />
        <div className="mt-1 flex items-center justify-end gap-3">
          <AnimatedButton type="button" variant="ghost" onClick={onClose} disabled={submitting}>{t("common.cancel")}</AnimatedButton>
          <AnimatedButton type="submit" loading={submitting}>{editing ? t("common.save") : t("accounts.new")}</AnimatedButton>
        </div>
      </form>
    </AnimatedModal>
  );
}

function TransferModal({ open, onClose, uid, accounts }: { open: boolean; onClose: () => void; uid: string | null; accounts: Account[] }) {
  const { t } = useLocale();
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => toDateInput(Date.now()));
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [initId, setInitId] = useState(false);

  if (open && !initId) { setInitId(true); setFromId(accounts[0]?.id ?? ""); setToId(""); setAmount(""); setNote(""); setError(null); }
  if (!open && initId) setInitId(false);

  const fromAccount = accounts.find((a) => a.id === fromId);
  // Destination must share the source currency — no exchange-rate invention.
  const toOptions = accounts.filter((a) => a.id !== fromId && a.currency === fromAccount?.currency);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!uid || !fromAccount) return;
    const amt = Number(amount);
    setError(null);
    setSubmitting(true);
    try {
      const input: TransferInput = { fromAccountId: fromId, toAccountId: toId, amount: amt, currency: fromAccount.currency, date: fromDateTimeInputs(date), note: note.trim() || undefined };
      await createTransfer(uid, input);
      toast({ title: t("accounts.transfer.done"), variant: "success" });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatedModal open={open} onClose={onClose} title={t("accounts.transfer")} description={t("accounts.transfer.hint")}>
      <form onSubmit={save} className="flex flex-col gap-4">
        <Select label={t("accounts.transfer.from")} value={fromId} onChange={(e) => { setFromId(e.target.value); setToId(""); }} options={accounts.map((a) => ({ value: a.id, label: `${a.name} (${a.currency})` }))} />
        <Select label={t("accounts.transfer.to")} value={toId} onChange={(e) => setToId(e.target.value)} options={[{ value: "", label: "—" }, ...toOptions.map((a) => ({ value: a.id, label: `${a.name} (${a.currency})` }))]} />
        <div className="grid grid-cols-2 gap-3">
          <Input label={t("accounts.transfer.amount")} type="number" inputMode="decimal" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" error={error ?? undefined} />
          <Input label={t("common.date")} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <Textarea label={t("accounts.note")} value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Optional" />
        <div className="mt-1 flex items-center justify-end gap-3">
          <AnimatedButton type="button" variant="ghost" onClick={onClose} disabled={submitting}>{t("common.cancel")}</AnimatedButton>
          <AnimatedButton type="submit" loading={submitting} disabled={!toId || !amount}><ArrowLeftRight className="size-4" />{t("accounts.transfer")}</AnimatedButton>
        </div>
      </form>
    </AnimatedModal>
  );
}
