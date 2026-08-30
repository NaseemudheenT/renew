"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, isSameMonth, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight, Wallet, RefreshCw, Bell, Plus, Check, Trash2, Clock } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { AnimatedButton } from "@/components/motion";
import { useScopedUserCollection } from "@/hooks/useScopedUserCollection";
import { dayStart, fromDateTimeInputs, toDateInput, timeLabel } from "@/lib/dates";
import { useLocale } from "@/components/providers/LocaleProvider";
import { createReminder, setReminderDone, deleteReminder, restoreReminder } from "@/lib/firestore/reminders";
import { toast } from "@/components/ui/toast-store";
import type { Payment, Subscription, Reminder } from "@/lib/types";
import { cn } from "@/lib/utils";

type Kind = "payment" | "subscription" | "reminder";
interface CalItem { id: string; kind: Kind; title: string; at: number; href?: string; done?: boolean }
const KIND_META: Record<Kind, { icon: typeof Wallet; dot: string }> = {
  payment: { icon: Wallet, dot: "bg-emerald-400" },
  subscription: { icon: RefreshCw, dot: "bg-violet-400" },
  reminder: { icon: Bell, dot: "bg-amber-400" },
};

export function CalendarView() {
  const { prefs, dueLabel, t } = useLocale();
  const loc = `${prefs.language}-${prefs.region}`;
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(() => new Date());
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("");
  const [adding, setAdding] = useState(false);

  // Calendar cells are calendar days, not instants — format them locale-aware
  // but WITHOUT the profile timezone, so the day number never shifts.
  const monthTitle = useMemo(
    () => new Intl.DateTimeFormat(loc, { month: "long", year: "numeric" }).format(cursor),
    [loc, cursor],
  );
  const dayAria = useMemo(
    () => new Intl.DateTimeFormat(loc, { weekday: "long", day: "numeric", month: "long" }),
    [loc],
  );
  const numFmt = useMemo(() => new Intl.NumberFormat(loc), [loc]);
  const weekdayLabels = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(loc, { weekday: "short" });
    const names: string[] = [];
    for (let i = 0; i < 7; i++) names.push(fmt.format(new Date(2023, 0, 1 + i))); // 2023-01-01 is Sunday
    const s = prefs.weekStart;
    return [...names.slice(s), ...names.slice(0, s)];
  }, [loc, prefs.weekStart]);
  const payments = useScopedUserCollection<Payment>("payments");
  const subscriptions = useScopedUserCollection<Subscription>("subscriptions");
  const reminders = useScopedUserCollection<Reminder>("reminders");
  const uid = reminders.uid;

  const items: CalItem[] = useMemo(() => {
    const out: CalItem[] = [];
    payments.data.forEach((p) => out.push({ id: p.id, kind: "payment", title: p.name, at: p.dueAt, href: "/payments" }));
    subscriptions.data.forEach((s) => { if (s.status === "active") out.push({ id: s.id, kind: "subscription", title: s.name, at: s.nextBillingAt, href: "/payments#subscriptions" }); });
    reminders.data.forEach((r) => out.push({ id: r.id, kind: "reminder", title: r.title, at: r.dueAt, done: r.completed }));
    return out;
  }, [payments.data, subscriptions.data, reminders.data]);

  const remindersById = useMemo(() => new Map(reminders.data.map((r) => [r.id, r])), [reminders.data]);

  async function toggleReminder(id: string, done: boolean) {
    if (!uid) return;
    try { await setReminderDone(uid, id, done); } catch { toast({ title: "Couldn't update", variant: "error" }); }
  }
  async function removeReminder(id: string) {
    if (!uid) return;
    const snapshot = remindersById.get(id);
    try {
      await deleteReminder(uid, id);
      toast({ title: "Reminder deleted", variant: "success", action: snapshot ? { label: "Undo", onClick: () => { void restoreReminder(uid, snapshot); } } : undefined });
    } catch { toast({ title: "Couldn't delete", variant: "error" }); }
  }
  async function addReminder() {
    const title = newTitle.trim();
    if (!uid || !title) return;
    setAdding(true);
    try {
      const dueAt = fromDateTimeInputs(toDateInput(selected.getTime()), newTime || undefined);
      await createReminder(uid, { title, dueAt, hasTime: !!newTime });
      setNewTitle(""); setNewTime("");
      toast({ title: "Reminder added", variant: "success" });
    } catch { toast({ title: "Couldn't add reminder", variant: "error" }); }
    finally { setAdding(false); }
  }

  const byDay = useMemo(() => {
    const map = new Map<number, CalItem[]>();
    for (const it of items) {
      const key = dayStart(it.at);
      const arr = map.get(key) ?? [];
      arr.push(it);
      map.set(key, arr);
    }
    return map;
  }, [items]);

  const days = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(cursor), { weekStartsOn: prefs.weekStart });
    const gridEnd = endOfWeek(endOfMonth(cursor), { weekStartsOn: prefs.weekStart });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [cursor, prefs.weekStart]);

  const selectedItems = useMemo(() => (byDay.get(dayStart(selected.getTime())) ?? []).sort((a, b) => a.at - b.at), [byDay, selected]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title={t("nav.calendar")} subtitle="Bills, subscriptions and your own reminders on one timeline." action={<AnimatedButton variant="glass" size="sm" onClick={() => { const now = new Date(); setCursor(now); setSelected(now); }}>Today</AnimatedButton>} />
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <GlassCard padded>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-strong text-lg font-medium capitalize">{monthTitle}</h2>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setCursor((c) => addMonths(c, -1))} aria-label="Previous month" className="grid size-9 place-items-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--glass-bg-soft)] hover:text-[var(--text-strong)]"><ChevronLeft className="size-5" /></button>
              <button type="button" onClick={() => setCursor((c) => addMonths(c, 1))} aria-label="Next month" className="grid size-9 place-items-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--glass-bg-soft)] hover:text-[var(--text-strong)]"><ChevronRight className="size-5" /></button>
            </div>
          </div>
          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-[var(--text-muted)]">
            {weekdayLabels.map((d, i) => <div key={i} className="py-1 capitalize">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const inMonth = isSameMonth(day, cursor);
              const isSel = isSameDay(day, selected);
              const today = isSameDay(day, new Date());
              const dayItems = byDay.get(dayStart(day.getTime())) ?? [];
              return (
                <button key={day.toISOString()} type="button" onClick={() => setSelected(day)} aria-label={dayAria.format(day)} aria-pressed={isSel}
                  className={cn("relative flex aspect-square flex-col items-center justify-start gap-1 rounded-xl p-1.5 text-sm transition-colors", inMonth ? "text-[var(--text-body)]" : "text-[var(--text-muted)]/50", isSel ? "bg-[var(--glass-bg-strong)] shadow-[inset_0_1px_0_var(--glass-edge)]" : "hover:bg-[var(--glass-bg-soft)]")}>
                  <span className={cn("grid size-6 place-items-center rounded-full text-xs tabular-nums", today && "bg-gradient-to-b from-gold-300 to-gold-500 font-semibold text-[var(--text-onGold)]", isSel && !today && "font-semibold text-[var(--text-strong)]")}>{numFmt.format(day.getDate())}</span>
                  {dayItems.length > 0 && (
                    <div className="flex flex-wrap items-center justify-center gap-0.5">
                      {dayItems.slice(0, 3).map((it) => <span key={it.id} className={cn("size-1.5 rounded-full", KIND_META[it.kind].dot)} />)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </GlassCard>
        <GlassCard padded className="h-max">
          <h2 className="text-strong text-base font-medium capitalize">{dayAria.format(selected)}</h2>
          <div className="mt-4">
            <AnimatePresence mode="wait">
              <motion.div key={selected.toISOString()} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                {selectedItems.length === 0 ? (
                  <EmptyState compact icon={Bell} title="Nothing planned" description="Add a reminder below." />
                ) : (
                  <ul className="flex flex-col gap-2">
                    {selectedItems.map((it) => {
                      const Icon = KIND_META[it.kind].icon;
                      if (it.kind === "reminder") {
                        return (
                          <li key={`reminder-${it.id}`} className="flex items-center gap-2.5 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3 py-2.5">
                            <button type="button" onClick={() => void toggleReminder(it.id, !it.done)} aria-label={it.done ? "Mark not done" : "Mark done"}
                              className={cn("grid size-5 shrink-0 place-items-center rounded-full border transition-colors", it.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-[var(--field-border)] hover:border-[var(--focus-ring)]")}>
                              {it.done && <Check className="size-3.5" />}
                            </button>
                            <span className={cn("min-w-0 flex-1 truncate text-sm", it.done ? "text-[var(--text-muted)] line-through" : "text-body")}>{it.title}</span>
                            {remindersById.get(it.id)?.hasTime && <span className="text-muted inline-flex items-center gap-1 text-xs"><Clock className="size-3" />{timeLabel(it.at)}</span>}
                            <button type="button" onClick={() => void removeReminder(it.id)} aria-label="Delete reminder" className="text-muted grid size-7 shrink-0 place-items-center rounded-full hover:bg-rose-500/10 hover:text-rose-500"><Trash2 className="size-3.5" /></button>
                          </li>
                        );
                      }
                      return (
                        <li key={`${it.kind}-${it.id}`}>
                          <Link href={it.href ?? "/payments"} className="flex items-center gap-3 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-3 transition-colors hover:border-[var(--focus-ring)]/50">
                            <Icon className="size-4 shrink-0 text-[var(--color-gold-500)]" />
                            <span className="text-body min-w-0 flex-1 truncate text-sm">{it.title}</span>
                            <span className="text-muted text-xs">{dueLabel(it.at)}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Add a reminder for the selected day */}
            <form onSubmit={(e) => { e.preventDefault(); void addReminder(); }} className="mt-4 border-t border-[var(--glass-border)] pt-4">
              <div className="flex items-center gap-2">
                <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Add a reminder…" aria-label="Reminder title"
                  className="text-body min-w-0 flex-1 rounded-xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3 py-2 text-sm outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--focus-ring)]" />
                <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} aria-label="Reminder time"
                  className="text-body w-[92px] shrink-0 rounded-xl border border-[var(--field-border)] bg-[var(--field-bg)] px-2 py-2 text-sm outline-none focus:border-[var(--focus-ring)]" />
                <button type="submit" disabled={!newTitle.trim() || adding} aria-label="Add reminder"
                  className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-b from-gold-300 to-gold-500 text-[var(--text-onGold)] transition-opacity disabled:opacity-40"><Plus className="size-4" /></button>
              </div>
            </form>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
