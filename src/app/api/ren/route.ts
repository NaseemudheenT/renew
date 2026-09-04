import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { llmConfigured, runRenAgent } from "@/lib/ren/agent.server";
import type { RenContext } from "@/lib/ren/tools.server";

export const runtime = "nodejs";

/**
 * REN orchestrator (spec §7). The ONLY entry point to REN's LLM brain. It:
 *  1. derives the user from the authenticated session (never a client uid, §12),
 *  2. builds a user-scoped context (currency/timezone/workspace/now from the client),
 *  3. runs the agentic tool-calling loop when an LLM key is configured,
 *  4. otherwise tells the client to use the on-device deterministic engine.
 * The AI key stays server-side; the model never sees the database.
 */

const bodySchema = z.object({
  message: z.string().trim().min(1).max(1000),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) })).max(12).default([]),
  now: z.number().optional(),
  timezone: z.string().trim().max(64).optional(),
  currency: z.string().trim().length(3).optional(),
  workspace: z.enum(["personal", "business"]).default("personal"),
  allowHighRisk: z.boolean().default(false),
});

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  // No LLM key → the client falls back to the deterministic on-device engine.
  if (!llmConfigured()) {
    console.log("[ren] mode=deterministic (no ANTHROPIC_API_KEY)");
    return NextResponse.json({ mode: "deterministic" }, { status: 200 });
  }

  let json: unknown;
  try { json = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const b = parsed.data;

  const ctx: RenContext = {
    uid: user.uid,
    currency: (b.currency ?? "USD").toUpperCase(),
    timezone: b.timezone || "UTC",
    workspace: b.workspace,
    now: b.now ?? Date.now(),
  };

  try {
    const result = await runRenAgent(ctx, b.message, b.history, { allowHighRisk: b.allowHighRisk });
    return NextResponse.json({ mode: "llm", ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("ren agent failed", err);
    // Fail safe: let the client fall back to the deterministic engine.
    return NextResponse.json({ mode: "deterministic", error: "REN is unavailable right now." }, { status: 200 });
  }
}
