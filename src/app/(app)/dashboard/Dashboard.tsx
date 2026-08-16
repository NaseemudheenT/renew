"use client";

import { useMemo } from "react";
import Link from "next/link";
import { where, orderBy } from "firebase/firestore";
import {
  Bell,
  ListTodo,
  Wallet,
  FileText,
  Plus,
  Sparkles,
  ChevronRight,
  Clock,
  AlertCircle,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { AnimatedButton, StaggerContainer, StaggerItem } from "@/components/motion";
import { useUserCollection } from "@/hooks/useUserCollection";
import { dueLabel, isOverdue, todayEnd } from "@/lib/dates";
import type { Reminder, Task, Payment, DocItem } from "@/lib/types";
import { cn } from "@/lib/utils";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function Dashboard({ firstName }: { firstName: string }) {
  const openReminders = useMemo(() => [where("completed", "==", false)], []);
  const openTasks = useMemo(() => [where("completed", "==", false)], []);
  const upcomingPayments = useMemo(
    () => [where("status", "in", ["upcoming", "overdue"])],
    [],
  );
  const allDocs = useMemo(() => [orderBy("createdAt", "desc")], []);

  const reminders = useUserCollection<Reminder>("reminders", openReminders);
  const tasks = useUserCollection<Task>("tasks", openTasks);
  const payments = useUserCollection<Payment>("payments", upcomingPayments);
  const docs = useUserCollection<DocItem>("documents", allDocs);

  const loading =
    reminders.loading || tasks.loading || payments.loading || docs.loading;

  const endToday = todayEnd();

  const todayReminders = useMemo(
    () =>
      reminders.data
        .filter((r) => r.dueAt <= endToday)
        .sort((a, b) => a.dueAt - b.dueAt),
    [reminders.data, endToday],
  );
  const upcomingReminders = useMemo(
    () =>
      reminders.data
        .filter((r) => r.dueAt > endToday)
        .sort((a, b) => a.dueAt - b.dueAt)
        .slice(0, 5),
    [reminders.data, endToday],
  );
  const sortedPayments = useMemo(
    () => [...payments.data].sort((a, b) => a.dueAt - b.dueAt).slice(0, 5),
    [payments.data],
  );
  const topTasks = useMemo(
    () =>
      [...tasks.data]
        .sort((a, b) => {
          if (a.dueAt != null && b.dueAt != null) return a.dueAt - b.dueAt;
          if (a.dueAt != null) return -1;
          if (b.dueAt != null) return 1;
          return b.order - a.order;
        })
        .slice(0, 5),
    [tasks.data],
  );

  const totalItems =
    reminders.data.length +
    tasks.data.length +
    payments.data.length +
    docs.data.length;

  const isBrandNew = !loading && totalItems === 0;

  return (
    <div className="mx-auto max-w-5xl">
      <StaggerContainer className="flex flex-col gap-6" stagger={0.07}>
        {/* Greeting */}
        <StaggerItem>
          <div className="pt-2">
            <p className="text-muted text-sm">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            <h1 className="text-strong mt-1 text-2xl font-light sm:text-3xl">
              {greeting()}, {firstName}.
            </h1>
          </div>
        </StaggerItem>

        {isBrandNew ? (
          <StaggerItem>
            <GlassCard padded>
              <EmptyState
                icon={Sparkles}
                title="Welcome to your calm command center"
                description="Renew keeps life's renewals, tasks, payments and documents in one place — so nothing important ever slips. Start with your first reminder."
                action={
                  <Link href="/reminders">
                    <AnimatedButton size="lg">
                      <Plus className="size-4" />
                      Create your first reminder
                    </AnimatedButton>
                  </Link>
                }
              />
            </GlassCard>
          </StaggerItem>
        ) : (
          <>
            {/* Stat tiles */}
            <StaggerItem>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile
                  href="/reminders"
                  icon={Bell}
                  label="Reminders"
                  value={reminders.data.length}
                  loading={loading}
                />
                <StatTile
                  href="/tasks"
                  icon={ListTodo}
                  label="Active tasks"
                  value={tasks.data.length}
                  loading={loading}
                />
                <StatTile
                  href="/payments"
                  icon={Wallet}
                  label="Upcoming"
                  value={payments.data.length}
                  loading={loading}
                />
                <StatTile
                  href="/documents"
                  icon={FileText}
                  label="Documents"
                  value={docs.data.length}
                  loading={loading}
                />
              </div>
            </StaggerItem>

            {/* Today */}
            <StaggerItem>
              <GlassCard padded>
                <SectionHeading
                  title="Today & overdue"
                  href="/reminders"
                  count={todayReminders.length}
                />
                {todayReminders.length === 0 ? (
                  <EmptyState
                    compact
                    icon={Bell}
                    title="Nothing due today"
                    description="You're clear for now. Enjoy the calm."
                  />
                ) : (
                  <ul className="mt-3 flex flex-col gap-2">
                    {todayReminders.map((r) => (
                      <ReminderRow key={r.id} reminder={r} />
                    ))}
                  </ul>
                )}
              </GlassCard>
            </StaggerItem>

            {/* Coming up */}
            <div className="grid gap-6 lg:grid-cols-2">
              <StaggerItem>
                <GlassCard padded className="h-full">
                  <SectionHeading title="Coming up" href="/reminders" />
                  {upcomingReminders.length === 0 ? (
                    <EmptyState
                      compact
                      icon={Clock}
                      title="No upcoming reminders"
                    />
                  ) : (
                    <ul className="mt-3 flex flex-col gap-2">
                      {upcomingReminders.map((r) => (
                        <ReminderRow key={r.id} reminder={r} />
                      ))}
                    </ul>
                  )}
                </GlassCard>
              </StaggerItem>

              <StaggerItem>
                <GlassCard padded className="h-full">
                  <SectionHeading title="Tasks" href="/tasks" count={topTasks.length} />
                  {topTasks.length === 0 ? (
                    <EmptyState compact icon={ListTodo} title="No active tasks" />
                  ) : (
                    <ul className="mt-3 flex flex-col gap-2">
                      {topTasks.map((t) => (
                        <TaskRow key={t.id} task={t} />
                      ))}
                    </ul>
                  )}
                </GlassCard>
              </StaggerItem>

              <StaggerItem className="lg:col-span-2">
                <GlassCard padded className="h-full">
                  <SectionHeading title="Payments" href="/payments" />
                  {sortedPayments.length === 0 ? (
                    <EmptyState compact icon={Wallet} title="No payments tracked" />
                  ) : (
                    <ul className="mt-3 flex flex-col gap-2">
                      {sortedPayments.map((p) => (
                        <PaymentRow key={p.id} payment={p} />
                      ))}
                    </ul>
                  )}
                </GlassCard>
              </StaggerItem>
            </div>
          </>
        )}
      </StaggerContainer>
    </div>
  );
}

/* ---- Small building blocks ---------------------------------------------- */

function StatTile({
  href,
  icon: Icon,
  label,
  value,
  loading,
}: {
  href: string;
  icon: typeof Bell;
  label: string;
  value: number;
  loading: boolean;
}) {
  return (
    <Link href={href}>
      <GlassCard className="flex items-center gap-3 p-4 transition-transform hover:-translate-y-0.5">
        <span className="glass grid size-10 shrink-0 place-items-center !rounded-2xl">
          <Icon className="size-5 text-[var(--color-gold-500)]" />
        </span>
        <div className="min-w-0">
          <div className="text-strong text-xl font-medium tabular-nums">
            {loading ? "—" : value}
          </div>
          <div className="text-muted truncate text-xs">{label}</div>
        </div>
      </GlassCard>
    </Link>
  );
}

function SectionHeading({
  title,
  href,
  count,
}: {
  title: string;
  href: string;
  count?: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-strong text-sm font-medium">
        {title}
        {count ? <span className="text-muted ml-2 tabular-nums">{count}</span> : null}
      </h2>
      <Link
        href={href}
        className="text-muted flex items-center gap-0.5 text-xs hover:text-[var(--text-strong)]"
      >
        View all
        <ChevronRight className="size-3.5" />
      </Link>
    </div>
  );
}

function ReminderRow({ reminder }: { reminder: Reminder }) {
  const overdue = isOverdue(reminder.dueAt);
  return (
    <li>
      <Link
        href="/reminders"
        className="flex items-center gap-3 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-3 transition-colors hover:border-[var(--focus-ring)]/50"
      >
        <span
          className={cn(
            "size-2 shrink-0 rounded-full",
            overdue ? "bg-rose-400" : "bg-[var(--color-gold-400)]",
          )}
        />
        <span className="text-body min-w-0 flex-1 truncate text-sm">
          {reminder.title}
        </span>
        <span
          className={cn(
            "flex items-center gap-1 text-xs",
            overdue ? "text-rose-500" : "text-[var(--text-muted)]",
          )}
        >
          {overdue && <AlertCircle className="size-3.5" />}
          {dueLabel(reminder.dueAt, reminder.hasTime)}
        </span>
      </Link>
    </li>
  );
}

function TaskRow({ task }: { task: Task }) {
  const overdue = task.dueAt != null && isOverdue(task.dueAt);
  return (
    <li>
      <Link
        href="/tasks"
        className="flex items-center gap-3 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-3 transition-colors hover:border-[var(--focus-ring)]/50"
      >
        <span className="size-2 shrink-0 rounded-full bg-sky-400" />
        <span className="text-body min-w-0 flex-1 truncate text-sm">{task.title}</span>
        {task.dueAt != null && (
          <span className={cn("text-xs", overdue ? "text-rose-500" : "text-[var(--text-muted)]")}>
            {dueLabel(task.dueAt)}
          </span>
        )}
      </Link>
    </li>
  );
}

function PaymentRow({ payment }: { payment: Payment }) {
  const overdue = payment.status === "overdue" || isOverdue(payment.dueAt);
  return (
    <li>
      <Link
        href="/payments"
        className="flex items-center gap-3 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-3 transition-colors hover:border-[var(--focus-ring)]/50"
      >
        <span className="text-body min-w-0 flex-1 truncate text-sm">
          {payment.name}
        </span>
        <span className="text-strong text-sm font-medium tabular-nums">
          {payment.currency} {payment.amount.toLocaleString()}
        </span>
        <span
          className={cn(
            "w-20 text-right text-xs",
            overdue ? "text-rose-500" : "text-[var(--text-muted)]",
          )}
        >
          {dueLabel(payment.dueAt)}
        </span>
      </Link>
    </li>
  );
}
