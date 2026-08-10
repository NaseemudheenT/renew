"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CalendarClock, Plus, Settings } from "lucide-react";
import { Atmosphere } from "@/components/atmosphere/live-atmosphere";
import { RenewMark } from "@/components/brand/renew-mark";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { ReminderCard } from "@/components/dashboard/reminder-card";
import { AddReminder } from "@/components/dashboard/add-reminder";
import { useAuth } from "@/components/providers/auth-provider";
import { useProfile } from "@/hooks/use-profile";
import { useReminders } from "@/hooks/use-reminders";
import { deleteReminder, updateReminder } from "@/lib/firestore/reminders";
import { daysUntil, sortReminders } from "@/lib/reminders/format";
import type { Reminder } from "@/lib/firestore/types";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, initializing } = useAuth();
  const profile = useProfile();
  const reminders = useReminders();
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!initializing && !user) router.replace("/login");
  }, [initializing, user, router]);

  const sorted = useMemo(() => (reminders ? sortReminders(reminders) : null), [reminders]);
  const stats = useMemo(() => {
    if (!reminders) return { active: 0, overdue: 0, soon: 0 };
    const active = reminders.filter((r) => !r.completed);
    return {
      active: active.length,
      overdue: active.filter((r) => daysUntil(r.dueDate) < 0).length,
      soon: active.filter((r) => {
        const d = daysUntil(r.dueDate);
        return d >= 0 && d <= 7;
      }).length,
    };
  }, [reminders]);

  if (initializing || !user) {
    return (
      <main className="relative grid min-h-dvh place-items-center">
        <Atmosphere />
        <RenewMark size={64} glow />
      </main>
    );
  }

  const name = profile?.name?.split(" ")[0] || "there";

  async function toggle(r: Reminder) {
    if (user) await updateReminder(user.uid, r.id, { completed: !r.completed });
  }
  async function remove(r: Reminder) {
    if (user) await deleteReminder(user.uid, r.id);
  }

  return (
    <main className="relative min-h-dvh">
      <Atmosphere />

      <div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-5 pb-28 sm:px-6">
        {/* Top bar */}
        <header className="flex items-center justify-between py-5">
          <div className="flex items-center gap-3">
            <RenewMark size={34} glow={false} />
            <span className="font-display text-sm tracking-[0.3em] text-[var(--gold)] uppercase">
              Renew
            </span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Link
              href="/settings"
              aria-label="Settings"
              className="grid size-10 place-items-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--gold)]"
            >
              <Settings className="size-5" />
            </Link>
          </div>
        </header>

        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 mb-8"
        >
          <h1 className="text-2xl font-light text-[var(--foreground)] sm:text-3xl">
            {greeting()}, <span className="text-gradient-gold font-normal">{name}</span>.
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {stats.active === 0
              ? "Nothing to worry about right now."
              : `You have ${stats.active} thing${stats.active === 1 ? "" : "s"} to keep an eye on.`}
          </p>
        </motion.div>

        {/* Overview */}
        {stats.active > 0 && (
          <div className="mb-8 grid grid-cols-3 gap-3">
            {[
              { label: "Active", value: stats.active, icon: Bell },
              { label: "Due soon", value: stats.soon, icon: CalendarClock },
              { label: "Overdue", value: stats.overdue, icon: Bell },
            ].map((s) => (
              <div key={s.label} className="glass rounded-[var(--radius-lg)] p-4">
                <p className="text-2xl font-light text-[var(--foreground)]">{s.value}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* List */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium tracking-wide text-[var(--muted)]">Your reminders</h2>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {sorted === null ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-[76px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--surface)]"
              />
            ))
          ) : sorted.length === 0 ? (
            <EmptyState onAdd={() => setAdding(true)} />
          ) : (
            <AnimatePresence initial={false}>
              {sorted.map((r) => (
                <ReminderCard
                  key={r.id}
                  reminder={r}
                  onToggle={toggle}
                  onDelete={remove}
                  locale={profile?.language}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Floating add button */}
      <motion.button
        onClick={() => setAdding(true)}
        aria-label="Add reminder"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        className="fixed right-5 bottom-6 z-40 flex h-14 items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--gold-bright),var(--gold),var(--gold-deep))] px-6 font-medium text-[var(--gold-contrast)] shadow-[0_12px_40px_-8px_color-mix(in_oklab,var(--gold)_70%,transparent)] sm:right-8 sm:bottom-8"
      >
        <Plus className="size-5" />
        Add
      </motion.button>

      <AddReminder open={adding} onClose={() => setAdding(false)} />
    </main>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass mt-2 flex flex-col items-center rounded-[var(--radius-2xl)] px-6 py-16 text-center"
    >
      <RenewMark size={64} glow />
      <h3 className="mt-6 text-lg font-medium text-[var(--foreground)]">Nothing to remember yet</h3>
      <p className="mt-2 max-w-xs text-sm text-[var(--muted)]">
        Add your first passport, insurance, bill, or subscription — Renew will watch it for you.
      </p>
      <Button size="lg" onClick={onAdd} className="mt-6">
        <Plus className="size-4" /> Add your first reminder
      </Button>
    </motion.div>
  );
}
