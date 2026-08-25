"use client";

import { useState } from "react";
import { BarChart3, CalendarDays } from "lucide-react";
import { AnalyticsView } from "./AnalyticsView";
import { CalendarView } from "../calendar/CalendarView";
import { cn } from "@/lib/utils";

type Tab = "analysis" | "calendar";

const TABS: { id: Tab; label: string; icon: typeof BarChart3 }[] = [
  { id: "analysis", label: "Analysis", icon: BarChart3 },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
];

/**
 * Insights — Analysis and the Calendar on ONE page, switched by a segmented
 * control. Both are the same, fully-working views; nothing about them changed.
 */
export function InsightsView() {
  const [tab, setTab] = useState<Tab>("analysis");

  return (
    <div>
      <div className="mb-5 flex justify-center lg:justify-start">
        <div className="glass inline-flex !rounded-full p-1 text-sm">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 font-medium transition-colors",
                  active ? "bg-[var(--glass-bg-strong)] text-[var(--text-strong)]" : "text-[var(--text-muted)] hover:text-[var(--text-strong)]",
                )}
              >
                <Icon className={cn("size-4", active && "text-[var(--color-gold-500)]")} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "analysis" ? <AnalyticsView /> : <CalendarView />}
    </div>
  );
}
