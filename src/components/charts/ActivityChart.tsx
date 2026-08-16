"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";

export interface DayBucket {
  label: string; // short day label, e.g. "M"
  fullLabel: string; // accessible label, e.g. "Mon 4 Aug"
  reminders: number;
  tasks: number;
}

/**
 * Stacked activity bars (reminders + tasks completed per day). Pure SVG, theme
 * aware, accessible (each bar has a title), and bars grow in on reveal.
 */
export function ActivityChart({ data }: { data: DayBucket[] }) {
  const reduced = useReducedMotion();
  const uid = useId();
  const max = Math.max(1, ...data.map((d) => d.reminders + d.tasks));

  return (
    <div>
      <div className="flex h-44 items-end gap-1">
        {data.map((d, i) => {
          const total = d.reminders + d.tasks;
          const rH = (d.reminders / max) * 100;
          const tH = (d.tasks / max) * 100;
          return (
            <div
              key={`${uid}-${i}`}
              className="flex h-full flex-1 flex-col items-center justify-end gap-1"
            >
              <div
                className="relative flex w-full max-w-9 flex-col justify-end"
                style={{ height: "100%" }}
                title={`${d.fullLabel}: ${total} completed`}
              >
                {tH > 0 && (
                  <motion.div
                    className="w-full rounded-t-md bg-sky-400/80"
                    initial={reduced ? false : { height: 0 }}
                    animate={{ height: `${tH}%` }}
                    transition={{ duration: 0.5, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}
                {rH > 0 && (
                  <motion.div
                    className="w-full bg-gradient-to-t from-gold-500 to-gold-300"
                    style={{ borderTopLeftRadius: tH > 0 ? 0 : 6, borderTopRightRadius: tH > 0 ? 0 : 6 }}
                    initial={reduced ? false : { height: 0 }}
                    animate={{ height: `${rH}%` }}
                    transition={{ duration: 0.5, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}
                {total === 0 && (
                  <div className="h-0.5 w-full rounded-full bg-[var(--glass-bg-soft)]" />
                )}
              </div>
              <span className="text-muted text-[10px]">{d.label}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs">
        <Legend color="bg-gradient-to-t from-gold-500 to-gold-300" label="Reminders" />
        <Legend color="bg-sky-400/80" label="Tasks" />
        <span className="text-muted ml-auto">Last {data.length} days</span>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="text-muted inline-flex items-center gap-1.5">
      <span className={`size-2.5 rounded-sm ${color}`} />
      {label}
    </span>
  );
}
