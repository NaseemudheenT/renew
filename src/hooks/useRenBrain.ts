"use client";

import { useCallback } from "react";
import { answerQuestion, type AskContext } from "@/lib/ask";
import { parseMoneyCommand } from "@/lib/ren";
import { createTransaction, deleteTransaction } from "@/lib/firestore/transactions";
import { nowMs } from "@/lib/dates";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useCategories } from "@/hooks/useCategories";
import { toast } from "@/components/ui/toast-store";
import { publicEnv } from "@/lib/env";

/** One thing Ren says back — the answer text, plus an optional headline amount. */
export interface RenReply {
  text: string;
  amount?: number;
  currency?: string;
}

/** A prior turn, so Ren has short-term memory of the conversation. */
export interface RenTurn {
  role: "user" | "ren";
  text: string;
}

/**
 * Ren's single brain, shared by every surface (the Siri-style voice orb AND the
 * full chat in Settings › Ren) so they can never drift apart. Give it the live
 * finance context and the signed-in uid; call `ask(text, history)`.
 *
 * When the LLM brain is enabled (publicEnv.renLlm) it routes through the server
 * orchestrator (/api/ren) for full natural language + authorized tool-calling;
 * on any failure — or when the brain is off — it falls back to the on-device
 * deterministic engine (records money or answers from real data, no network,
 * always correct per the Constitution). Ren therefore always answers.
 */
export function useRenBrain(ctx: Omit<AskContext, "now">, uid: string | null) {
  const { money, prefs } = useLocale();
  const { mode } = useWorkspace();
  const { profile } = useUserProfile();
  const { resolve } = useCategories();

  const ask = useCallback(
    async (raw: string, history: RenTurn[] = []): Promise<RenReply> => {
      const text = raw.trim();
      if (!text) return { text: "" };

      // 1) The LLM brain, when enabled — full natural language + authorized tools.
      if (publicEnv.renLlm) {
        try {
          const h = history.slice(-10).map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));
          const res = await fetch("/api/ren", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text, history: h, now: nowMs(), timezone: prefs.timezone, currency: ctx.currency, workspace: mode, style: profile?.renStyle, personality: profile?.renPersonality, memory: profile?.renMemory }),
          });
          if (res.ok) {
            const data = (await res.json()) as { mode?: string; text?: string };
            if (data.mode === "llm" && data.text) return { text: data.text };
          }
        } catch {
          /* fall through to the on-device engine */
        }
      }

      // 2) On-device: a command to record money? ("spent 500 on groceries")
      const draft = parseMoneyCommand(text);
      if (draft && uid) {
        const label = resolve(draft.category).label;
        const note = draft.note || label;
        try {
          const id = await createTransaction(uid, { type: draft.type, amount: draft.amount, currency: ctx.currency, category: draft.category, note, date: nowMs() });
          const line = draft.type === "income"
            ? `Added ${money(draft.amount, ctx.currency)} income to ${label}.`
            : `Added ${money(draft.amount, ctx.currency)} to ${label}.`;
          toast({ title: "Added by Ren", variant: "success", action: { label: "Undo", onClick: () => deleteTransaction(uid, id).catch(() => {}) } });
          return { text: line, amount: draft.amount, currency: ctx.currency };
        } catch {
          return { text: "I couldn't save that just now — please try again." };
        }
      }

      // 3) On-device: a question about their money?
      const a = answerQuestion(text, { ...ctx, now: nowMs() });
      if (a) {
        const line = a.value !== undefined
          ? `${a.title}: ${money(a.value, a.currency ?? ctx.currency)}.${a.detail ? " " + a.detail : ""}`
          : (a.detail ?? a.title);
        return a.value !== undefined ? { text: line, amount: a.value, currency: a.currency ?? ctx.currency } : { text: line };
      }

      // 4) Didn't understand.
      return { text: "I can add money — say “spent 500 on groceries” — or answer things like “how much did I spend this month?”" };
    },
    [ctx, uid, money, prefs.timezone, mode, profile, resolve],
  );

  return { ask };
}
