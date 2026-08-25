"use client";

import { useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedAmount } from "@/components/finance/AnimatedAmount";
import { answerQuestion, type AskContext, type AskAnswer } from "@/lib/ask";
import { cn } from "@/lib/utils";

const CHIPS = [
  "How much did I spend this month?",
  "Am I on track this month?",
  "What's my biggest expense?",
  "How much are my subscriptions?",
  "What did I earn this month?",
  "What's my net worth?",
];

/**
 * "Ask Renew" — the first Money Assistant. Answers questions about your money
 * instantly and privately, straight from your own data (deterministic, no LLM).
 * Quick questions always give an exact answer; free text is best-effort with a
 * gentle fallback so it never feels broken.
 */
export function AskRenew(ctx: Omit<AskContext, "now">) {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<AskAnswer | "none" | null>(null);

  function ask(question: string) {
    const text = question.trim();
    if (!text) return;
    setQ(text);
    setAnswer(answerQuestion(text, ctx) ?? "none");
  }

  return (
    <GlassCard padded className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-[radial-gradient(circle,var(--bokeh-2),transparent_72%)] blur-2xl opacity-70" />
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-xl bg-[var(--glass-bg-strong)]"><Sparkles className="size-4 text-[var(--color-gold-500)]" /></span>
        <div>
          <h2 className="text-strong text-sm font-medium">Ask Renew</h2>
          <p className="text-muted text-xs">Answered instantly from your own data — nothing leaves your device.</p>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); ask(q); }} className="mt-4 flex items-center gap-2 rounded-full border border-[var(--field-border)] bg-[var(--field-bg)] ps-4 pe-1.5 focus-within:border-[var(--focus-ring)]">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask about your money…"
          aria-label="Ask Renew a question"
          className="h-11 min-w-0 flex-1 bg-transparent text-sm text-[var(--text-strong)] placeholder:text-[var(--text-muted)] focus:outline-none"
        />
        <button type="submit" aria-label="Ask" disabled={!q.trim()} className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--glass-bg-strong)] text-[var(--color-gold-500)] transition-opacity disabled:opacity-40">
          <ArrowRight className="size-4" />
        </button>
      </form>

      {answer && answer !== "none" && (
        <div className="mt-4 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] p-4">
          <p className="text-muted text-xs">{answer.title}</p>
          {answer.value !== undefined ? (
            <AnimatedAmount value={answer.value} currency={answer.currency ?? ctx.currency} className="text-strong mt-1 block text-3xl font-light tabular-nums" />
          ) : (
            answer.detail && <p className="text-strong mt-1 text-base">{answer.detail}</p>
          )}
          {answer.value !== undefined && answer.detail && <p className="text-muted mt-1 text-sm">{answer.detail}</p>}
        </div>
      )}
      {answer === "none" && (
        <p className="text-muted mt-4 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] p-4 text-sm">
          I couldn&apos;t work that one out yet. Try one of the questions below — or ask about a category, this month, or last month.
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => ask(c)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              "border-[var(--field-border)] bg-[var(--field-bg)] text-[var(--text-body)] hover:border-[var(--focus-ring)]/50 hover:text-[var(--text-strong)]",
            )}
          >
            {c}
          </button>
        ))}
      </div>
    </GlassCard>
  );
}
