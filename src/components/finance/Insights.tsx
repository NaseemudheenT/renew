"use client";

import { Sparkles, TrendingUp, TrendingDown, RefreshCw, Wallet, type LucideIcon } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useCategories } from "@/hooks/useCategories";
import type { Insight } from "@/lib/insights";
import { cn } from "@/lib/utils";

type Tone = "good" | "warn" | "neutral";

/** "Renew noticed" — the autopilot brain surfacing honest, useful observations. */
export function Insights({ insights, currency }: { insights: Insight[]; currency: string }) {
  const { money } = useLocale();
  const { resolve } = useCategories();
  if (insights.length === 0) return null;

  function render(i: Insight): { icon: LucideIcon; text: string; tone: Tone } {
    switch (i.kind) {
      case "safe": {
        const amt = i.amount ?? 0;
        return amt >= 0
          ? { icon: Wallet, tone: "good", text: `You have ${money(amt, currency)} safe to spend this month.` }
          : { icon: Wallet, tone: "warn", text: `You're ${money(Math.abs(amt), currency)} beyond your income this month.` };
      }
      case "top":
        return { icon: TrendingUp, tone: "neutral", text: `${resolve(i.category ?? "").label} is your biggest spend this month — ${money(i.amount ?? 0, currency)}.` };
      case "trend": {
        const pct = i.pct ?? 0;
        if (pct > 0) return { icon: TrendingUp, tone: pct >= 25 ? "warn" : "neutral", text: `You've spent ${pct}% more than last month.` };
        if (pct < 0) return { icon: TrendingDown, tone: "good", text: `You've spent ${Math.abs(pct)}% less than last month — nice.` };
        return { icon: TrendingUp, tone: "neutral", text: "Your spending matches last month." };
      }
      case "recurring":
        return { icon: RefreshCw, tone: "neutral", text: `${i.count} subscriptions cost about ${money(i.amount ?? 0, currency)}/month.` };
      case "category_change":
        return { icon: TrendingUp, tone: "warn", text: `You're spending more on ${resolve(i.category ?? "").label} — ${money(i.amount ?? 0, currency)} this month, up ${i.pct}%.` };
    }
  }

  return (
    <GlassCard padded>
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-[var(--color-gold-500)]" />
        <h2 className="text-strong text-sm font-medium">Renew noticed</h2>
      </div>
      <ul className="mt-3 flex flex-col gap-2.5">
        {insights.map((i) => {
          const { icon: Icon, text, tone } = render(i);
          return (
            <li key={i.id} className="flex items-start gap-3 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-2.5">
              <Icon className={cn("mt-0.5 size-4 shrink-0", tone === "good" ? "text-emerald-400" : tone === "warn" ? "text-amber-400" : "text-[var(--color-gold-500)]")} />
              <span className="text-body text-sm">{text}</span>
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}
