"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, isSameMonth, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight, Bell, ListTodo, Wallet, RefreshCw } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { AnimatedButton } from "@/components/motion";
import { useUserCollection } from "@/hooks/useUserCollection";
import { dayStart } from "@/lib/dates";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { Reminder, Task, Payment, Subscription } from "@/lib/types";
import { cn } from "@/lib/utils";

type Kind = "reminder" | "task" | "payment" | "subscription";
interface CalItem { id: string; kind: Kind; title: string; at: number; href: string }
const KIND_META: Record<Kind, { icon: typeof Bell; dot: string }> = {
  reminder: { icon: Bell, dot: "bg-[var(--color-gold-400)]" },
  task: { icon: ListTodo, dot: "bg-sky-400" },
  payment: { icon: Wallet, dot: "bg-emerald-400" },
  subscription: { icon: RefreshCw, dot: "bg-violet-400" },
};

export function CalendarView() {
  const { prefs, dueLabel, t } = useLocale();
  const loc = `${prefs.language}-${prefs.region}`;
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(() => new Date());
  const reminders = useUserCollection<Reminder>("reminders");

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
  const tasks = useUserCollection<Task>("tasks");
  const payments = useUserCollection<Payment>("payments");
  const subscriptions = useUserCollection<Subscription>("subscriptions");

  const items: CalItem[] = useMemo(() => {
    const out: CalItem[] = [];
    reminders.data.forEach((r) => out.push({ id: r.id, kind: "reminder", title: r.title, at: r.dueAt, href: "/reminders" }));
    tasks.data.forEach((t) => { if (t.dueAt) out.push({ id: t.id, kind: "task", title: t.title, at: t.dueAt, href: "/tasks" }); });
    payments.data.forEach((p) => out.push({ id: p.id, kind: "payment", title: p.name, at: p.dueAt, href: "/payments" }));
    subscriptions.data.forEach((s) => { if (s.status === "active") out.push({ id: s.id, kind: "subscription", title: s.name, at: s.nextBillingAt, href: "/subscriptions" }); });
    return out;
  }, [reminders.data, tasks.data, payments.data, subscriptions.data]);

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
      <PageHeader title={t("nav.calendar")} subtitle="Your reminders, tasks and payments on one timeline." action={<AnimatedButton variant="glass" size="sm" onClick={() => { const now = new Date(); setCursor(now); setSelected(now); }}>Today</AnimatedButton>} />
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
                  <EmptyState compact icon={Bell} title="Nothing scheduled" />
                ) : (
                  <ul className="flex flex-col gap-2">
                    {selectedItems.map((it) => {
                      const Icon = KIND_META[it.kind].icon;
                      return (
                        <li key={`${it.kind}-${it.id}`}>
                          <Link href={it.href} className="flex items-center gap-3 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-3 transition-colors hover:border-[var(--focus-ring)]/50">
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
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
