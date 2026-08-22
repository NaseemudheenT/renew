"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Search, CornerDownLeft, type LucideIcon } from "lucide-react";
import { useUserCollection } from "@/hooks/useUserCollection";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useCategories } from "@/hooks/useCategories";
import { investmentMeta } from "@/lib/finance";
import { accountTypeMeta, subscriptionIcon } from "@/lib/accounts";
import { categoryMeta } from "@/lib/categories";
import type { MessageKey } from "@/lib/i18n/messages";
import type {
  Transaction,
  Budget,
  SavingsGoal,
  Investment,
  Payment,
  Account,
  Subscription,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface Hit {
  id: string;
  groupKey: MessageKey;
  icon: LucideIcon;
  label: string;
  sub: string;
  href: string;
  blob: string;
}

/**
 * RENEW global search — a cinematic command palette over the whole account.
 * Opens from the top bar or ⌘/Ctrl-K, closes on Esc/backdrop. Arrow keys move
 * the selection; Enter opens it. Data is only subscribed while open.
 */
export function GlobalSearch() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("common.search")}
        className="grid size-9 place-items-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--glass-bg-soft)] hover:text-[var(--text-strong)]"
      >
        <Search className="size-5" />
      </button>
      <AnimatePresence>{open && <SearchPanel onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const { t, money } = useLocale();
  const { resolve } = useCategories();
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);

  const transactions = useUserCollection<Transaction>("transactions");
  const budgets = useUserCollection<Budget>("budgets");
  const savings = useUserCollection<SavingsGoal>("savings");
  const investments = useUserCollection<Investment>("investments");
  const payments = useUserCollection<Payment>("payments");
  const accounts = useUserCollection<Account>("accounts");
  const subscriptions = useUserCollection<Subscription>("subscriptions");

  useEffect(() => {
    // Lock background scroll and restore focus to the trigger on close, to
    // match the dialog accessibility of AnimatedModal.
    const lastFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      lastFocused?.focus?.();
    };
  }, []);

  const hits = useMemo<Hit[]>(() => {
    const out: Hit[] = [];
    for (const tx of transactions.data) {
      const meta = resolve(tx.category);
      const amount = money(tx.amount, tx.currency);
      out.push({
        id: `tx-${tx.id}`,
        groupKey: "nav.transactions",
        icon: meta.icon,
        label: tx.note || meta.label,
        sub: `${meta.label} · ${tx.type === "income" ? "+" : "−"}${amount}`,
        href: "/transactions",
        blob: `${tx.note ?? ""} ${meta.label} ${amount}`.toLowerCase(),
      });
    }
    for (const p of payments.data) {
      const meta = categoryMeta(p.category);
      const amount = money(p.amount, p.currency);
      out.push({
        id: `pay-${p.id}`,
        groupKey: "nav.payments",
        icon: meta.icon,
        label: p.name,
        sub: `${meta.label} · ${amount}`,
        href: "/payments",
        blob: `${p.name} ${meta.label} ${amount}`.toLowerCase(),
      });
    }
    for (const g of savings.data) {
      out.push({
        id: `sav-${g.id}`,
        groupKey: "nav.savings",
        icon: resolve("other_income").icon,
        label: g.name,
        sub: `${money(g.current, g.currency)} / ${money(g.target, g.currency)}`,
        href: "/savings",
        blob: `${g.name}`.toLowerCase(),
      });
    }
    for (const inv of investments.data) {
      const meta = investmentMeta(inv.itype);
      out.push({
        id: `inv-${inv.id}`,
        groupKey: "nav.investments",
        icon: meta.icon,
        label: inv.name,
        sub: `${meta.label} · ${money(inv.quantity * inv.currentPrice, inv.currency)}`,
        href: "/investments",
        blob: `${inv.name} ${meta.label}`.toLowerCase(),
      });
    }
    for (const b of budgets.data) {
      const meta = resolve(b.category);
      out.push({
        id: `bud-${b.id}`,
        groupKey: "nav.budget",
        icon: meta.icon,
        label: meta.label,
        sub: money(b.amount, b.currency),
        href: "/budget",
        blob: `${meta.label} budget`.toLowerCase(),
      });
    }
    for (const a of accounts.data) {
      const meta = accountTypeMeta(a.atype);
      out.push({
        id: `acc-${a.id}`,
        groupKey: "nav.accounts",
        icon: meta.icon,
        label: a.name,
        sub: `${meta.label}${a.institution ? ` · ${a.institution}` : ""}`,
        href: "/accounts",
        blob: `${a.name} ${meta.label} ${a.institution ?? ""}`.toLowerCase(),
      });
    }
    for (const s of subscriptions.data) {
      out.push({
        id: `sub-${s.id}`,
        groupKey: "nav.subscriptions",
        icon: subscriptionIcon,
        label: s.name,
        sub: money(s.price, s.currency),
        href: "/subscriptions",
        blob: `${s.name} subscription`.toLowerCase(),
      });
    }
    return out;
  }, [transactions.data, payments.data, savings.data, investments.data, budgets.data, accounts.data, subscriptions.data, money, resolve]);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    return hits.filter((h) => h.blob.includes(query)).slice(0, 24);
  }, [hits, q]);

  function onQueryChange(next: string) {
    setQ(next);
    setActive(0);
  }

  function choose(hit: Hit) {
    router.push(hit.href);
    onClose();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Tab") {
      const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (nodes && nodes.length > 0) {
        const first = nodes[0]!;
        const last = nodes[nodes.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
      return;
    }
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      const hit = results[active];
      if (hit) choose(hit);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <button
        type="button"
        aria-label={t("common.close")}
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm"
      />
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("common.search")}
        onKeyDown={onKeyDown}
        className="relative w-full max-w-xl overflow-hidden rounded-glass-lg border border-[var(--menu-border)] bg-[var(--menu-bg)] shadow-[var(--glass-shadow)] backdrop-blur-xl"
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduced ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
      >
        <div className="flex items-center gap-3 border-b border-[var(--glass-border)] px-4 py-3.5">
          <Search className="size-5 shrink-0 text-[var(--text-muted)]" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t("search.placeholder")}
            aria-label={t("search.placeholder")}
            className="h-6 flex-1 bg-transparent text-[0.95rem] text-[var(--text-strong)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
          <kbd className="rounded-md border border-[var(--glass-border)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]">Esc</kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-2">
          {q.trim() === "" ? (
            <p className="px-3 py-6 text-center text-sm text-[var(--text-muted)]">{t("search.hint")}</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-[var(--text-muted)]">{t("search.empty")}</p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {results.map((hit, i) => {
                const Icon = hit.icon;
                const isActive = i === active;
                return (
                  <li key={hit.id}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => choose(hit)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors",
                        isActive ? "bg-[var(--glass-bg-strong)]" : "hover:bg-[var(--glass-bg-soft)]",
                      )}
                    >
                      <span className="glass grid size-9 shrink-0 place-items-center !rounded-xl">
                        <Icon className="size-4.5 text-[var(--color-gold-500)]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="text-strong block truncate text-sm font-medium">{hit.label}</span>
                        <span className="text-muted block truncate text-xs">{hit.sub}</span>
                      </span>
                      <span className="text-muted shrink-0 text-[10px] uppercase tracking-wide">{t(hit.groupKey)}</span>
                      {isActive && <CornerDownLeft className="size-3.5 shrink-0 text-[var(--text-muted)]" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
