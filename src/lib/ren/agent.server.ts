import "server-only";

import { getServerEnv } from "@/lib/env";
import { REN_TOOLS, TOOL_BY_NAME, toolDefsForLLM, type RenContext } from "./tools.server";

/**
 * REN's LLM orchestrator (spec §7). Runs an agentic tool-calling loop against the
 * configured provider (Anthropic by default; swappable). The model NEVER touches
 * the database — it can only ask for a tool, which the orchestrator validates
 * (Zod), authorizes (uid from the session, in ctx), and runs. High-risk writes
 * are NOT executed without explicit confirmation (§18): they come back as a
 * confirmation request the UI must approve. Every number REN states comes from a
 * tool result — never invented (§17).
 */

export function llmConfigured(): boolean {
  return !!getServerEnv().anthropicApiKey;
}

export interface RenAction { tool: string; risk: string; result: unknown }
export interface RenConfirmation { tool: string; args: Record<string, unknown>; summary: string }
export interface RenAgentResult {
  text: string;
  actions: RenAction[];
  /** Present when a high-risk op needs the user's explicit yes before it runs. */
  confirmation?: RenConfirmation;
}

interface ContentBlock {
  type: string;
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
}
interface Msg { role: "user" | "assistant"; content: string | ContentBlock[] }

const API_URL = "https://api.anthropic.com/v1/messages";
const MAX_TURNS = 6;

function systemPrompt(ctx: RenContext, nowLocal: string): string {
  return [
    "You are Ren, Renew's personal financial assistant. You are intelligent, natural, concise and calm — a premium assistant, never robotic, never childish, never judgmental. Do not add disclaimers or say 'as an AI'.",
    "You help with the user's OWN money only, through the provided tools. You cannot see the database directly — call a tool to read or change anything.",
    "NEVER invent numbers, balances, transactions, prices, merchants, or results. Every figure you state must come from a tool result. If a tool returns no data, say so plainly.",
    "Frame analytics honestly ('based on your recorded expenses…'). Distinguish fact vs estimate.",
    "To record money, you need amount, type (income/expense) and category. If any is missing or ambiguous, ASK — never guess a category, date or amount.",
    "Before deleting or changing an existing transaction, confirm the exact target with the user.",
    `Money is in ${ctx.currency}. The user's timezone is ${ctx.timezone}. The current date/time for the user is ${nowLocal}. Resolve relative dates ('yesterday', 'last month') in the user's timezone.`,
    "Keep replies short and spoken-friendly — they may be read aloud.",
  ].join("\n");
}

async function callAnthropic(system: string, messages: Msg[], signal: AbortSignal) {
  const env = getServerEnv();
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "x-api-key": env.anthropicApiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: env.renModel,
      max_tokens: 1024,
      system,
      tools: toolDefsForLLM(),
      messages,
    }),
    signal,
  });
  console.log(`[ren] anthropic status=${res.status}`);
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`LLM ${res.status}: ${detail.slice(0, 300)}`);
  }
  return (await res.json()) as { content: ContentBlock[]; stop_reason: string };
}

/**
 * Run one REN turn. `history` is prior {role,content} messages (already trimmed
 * by the caller). Returns REN's text plus any actions taken / confirmation needed.
 */
export async function runRenAgent(
  ctx: RenContext,
  message: string,
  history: Msg[],
  opts: { allowHighRisk?: boolean; style?: "concise" | "balanced" | "detailed" } = {},
): Promise<RenAgentResult> {
  void REN_TOOLS; // ensure the registry is loaded
  const nowLocal = new Intl.DateTimeFormat("en-US", {
    timeZone: ctx.timezone, dateStyle: "full", timeStyle: "short",
  }).format(new Date(ctx.now));
  const styleLine = opts.style === "concise"
    ? "Answer in one short sentence where possible."
    : opts.style === "detailed"
      ? "You may give a fuller explanation when it helps, but stay clear and skimmable."
      : "Keep replies brief and to the point.";
  const system = `${systemPrompt(ctx, nowLocal)}\n${styleLine}`;

  const messages: Msg[] = [...history, { role: "user", content: message }];
  const actions: RenAction[] = [];

  // Safe telemetry only — never the key, the user's message, or any amounts.
  console.log(`[ren] llm turn model=${getServerEnv().renModel} tz=${ctx.timezone} ccy=${ctx.currency}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const reply = await callAnthropic(system, messages, controller.signal);
      const toolUses = reply.content.filter((b) => b.type === "tool_use");

      if (reply.stop_reason !== "tool_use" || toolUses.length === 0) {
        const text = reply.content.filter((b) => b.type === "text").map((b) => b.text ?? "").join(" ").trim();
        console.log(`[ren] done turns=${turn + 1} actions=${actions.length}`);
        return { text: text || "Done.", actions };
      }
      console.log(`[ren] tool_use: ${toolUses.map((t) => t.name).join(", ")}`);

      // Run each requested tool, collecting results to feed back.
      messages.push({ role: "assistant", content: reply.content });
      const toolResults: ContentBlock[] = [];
      for (const tu of toolUses) {
        const tool = tu.name ? TOOL_BY_NAME[tu.name] : undefined;
        let resultPayload: unknown;
        if (!tool) {
          resultPayload = { error: "unknown tool" };
        } else {
          const parsed = tool.schema.safeParse(tu.input ?? {});
          if (!parsed.success) {
            resultPayload = { error: "invalid arguments", issues: parsed.error.issues.map((i: { message: string }) => i.message) };
          } else if (tool.risk === "high" && !opts.allowHighRisk) {
            // Do NOT execute — surface a confirmation the UI must approve.
            clearTimeout(timeout);
            return {
              text: "",
              actions,
              confirmation: { tool: tool.name, args: parsed.data as Record<string, unknown>, summary: `${tool.name} ${JSON.stringify(parsed.data)}` },
            };
          } else {
            try {
              resultPayload = await tool.execute(ctx, parsed.data);
              actions.push({ tool: tool.name, risk: tool.risk, result: resultPayload });
            } catch (e) {
              resultPayload = { error: e instanceof Error ? e.message : "tool failed" };
            }
          }
        }
        toolResults.push({ type: "tool_result", id: tu.id, text: JSON.stringify(resultPayload) } as ContentBlock);
      }
      // Anthropic expects tool_result blocks with tool_use_id; map id → tool_use_id.
      messages.push({ role: "user", content: toolResults.map((r) => ({ type: "tool_result", tool_use_id: r.id, content: r.text })) as unknown as ContentBlock[] });
    }
    return { text: "This is taking more steps than expected — could you rephrase?", actions };
  } finally {
    clearTimeout(timeout);
  }
}
