"use client";

import { useMemo } from "react";
import { subDays, format, startOfDay } from "date-fns";
import { BarChart3, CheckCircle2, Layers, TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { StaggerContainer, StaggerItem } from "@/components/motion";
import { ActivityChart, type DayBucket } from "@/components/charts/ActivityChart";
import {
  CategoryBreakdown,
  type CategoryDatum,
} from "@/components/charts/CategoryBreakdown";
import { useUserCollection } from "@/hooks/useUserCollection";
import type { Reminder, Task, Payment, DocItem, Category } from "@/lib/types";

const DAYS = 14;

export function AnalyticsView() {
  const reminders = useUserCollection<Reminder>("reminders");
  const tasks = useUserCollection<Task>("tasks");
  const payments = useUserCollection<Payment>("payments");
  const docs = useUserCollection<DocItem>("documents");

  const loading =
    reminders.loading || tasks.loading || payments.loading || docs.loading;

  const totalItems =
    reminders.data.length + tasks.data.length + payments.data.length + docs.data.length;

  const buckets: DayBucket[] = useMemo(() => {
    const days: DayBucket[] = [];
    for (let i = DAYS - 1; i >= 0; i--) {
      const day = startOfDay(subDays(new Date(), i));
      const start = day.getTime();
      const end = start + 24 * 60 * 60 * 1000;
      const rCount = reminders.data.filter(
        (r) => r.completed && r.completedAt != null && r.completedAt >= start && r.completedAt < end,
      ).length;
      const tCount = tasks.data.filter(
        (t) => t.completed && t.completedAt != null && t.completedAt >= start && t.completedAt < end,
      ).length;
      days.push({
        label: format(day, "EEEEE"),
        fullLabel: format(day, "EEE d MMM"),
        reminders: rCount,
        tasks: tCount,
      });
    }
    return days;
  }, [reminders.data, tasks.data]);

  const categoryData: CategoryDatum[] = useMemo(() => {
    const counts = new Map<Category, number>();
    reminders.data
      .filter((r) => !r.completed)
      .forEach((r) => counts.set(r.category, (counts.get(r.category) ?? 0) + 1));
    payments.data
      .filter((p) => p.status !== "paid")
      .forEach((p) => counts.set(p.category, (counts.get(p.category) ?? 0) + 1));
    return Array.from(counts.entries())
      .map(([category, count]) => ({ category, count }))
      .filter((d) => d.count > 0);
  }, [reminders.data, payments.data]);

  const completed30 = useMemo(() => {
    const cutoff = subDays(new Date(), 30).getTime();
    const r = reminders.data.filter(
      (x) => x.completed && (x.completedAt ?? 0) >= cutoff,
    ).length;
    const t = tasks.data.filter(
      (x) => x.completed && (x.completedAt ?? 0) >= cutoff,
    ).length;
    return r + t;
  }, [reminders.data, tasks.data]);

  const activeObligations =
    reminders.data.filter((r) => !r.completed).length +
    tasks.data.filter((t) => !t.completed).length +
    payments.data.filter((p) => p.status !== "paid").length;

  const totalCompletions = useMemo(
    () =>
      reminders.data.filter((r) => r.completed).length +
      tasks.data.filter((t) => t.completed).length,
    [reminders.data, tasks.data],
  );

  const hasActivity = buckets.some((b) => b.reminders + b.tasks > 0);

  if (!loading && totalItems === 0) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title="Analytics" />
        <GlassCard padded>
          <EmptyState
            icon={BarChart3}
            title="Nothing to chart yet"
            description="As you add reminders, complete tasks and track payments, a simple picture of your activity will build here — always from your real data."
          />
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Analytics"
        subtitle="A calm, honest picture of your life-management activity."
      />

      <StaggerContainer className="flex flex-col gap-6" stagger={0.07}>
        <StaggerItem>
          <div className="grid grid-cols-3 gap-3">
            <Stat icon={CheckCircle2} label="Done · 30 days" value={completed30} />
            <Stat icon={Layers} label="Active" value={activeObligations} />
            <Stat icon={TrendingUp} label="Completed" value={totalCompletions} />
          </div>
        </StaggerItem>

        <StaggerItem>
          <GlassCard padded>
            <h2 className="text-strong mb-4 text-sm font-medium">Activity</h2>
            {hasActivity ? (
              <ActivityChart data={buckets} />
            ) : (
              <EmptyState
                compact
                icon={TrendingUp}
                title="No completions yet"
                description="Complete a reminder or task and it will appear here."
              />
            )}
          </GlassCard>
        </StaggerItem>

        <StaggerItem>
          <GlassCard padded>
            <h2 className="text-strong mb-4 text-sm font-medium">
              Active obligations by category
            </h2>
            {categoryData.length > 0 ? (
              <CategoryBreakdown data={categoryData} />
            ) : (
              <EmptyState compact icon={Layers} title="Nothing active right now" />
            )}
          </GlassCard>
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: number;
}) {
  return (
    <GlassCard className="flex flex-col gap-1 p-4">
      <Icon className="size-5 text-[var(--color-gold-500)]" />
      <div className="text-strong mt-1 text-2xl font-medium tabular-nums">{value}</div>
      <div className="text-muted text-xs">{label}</div>
    </GlassCard>
  );
}
