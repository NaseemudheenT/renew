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

/**
 * Best-effort per-user rate limit for the LLM endpoint — protects against a
 * runaway loop or abuse driving up cost. In-memory, so it's per serverless
 * instance (not global); it still stops a single session from hammering a warm
 * instance. A durable cross-instance limit would use Redis/Firestore later.
 */
const RATE_MAX = 20; // requests
const RATE_WINDOW_MS = 60_000; // per minute, per user
const hits = new Map<string, number[]>();
function rateLimited(uid: string): boolean {
  const now = Date.now();
  const recent = (hits.get(uid) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(uid, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (v.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(k);
  return recent.length > RATE_MAX;
}

const bodySchema = z.object({
  message: z.string().trim().min(1).max(1000),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) })).max(12).default([]),
  now: z.number().optional(),
  timezone: z.string().trim().max(64).optional(),
  currency: z.string().trim().length(3).optional(),
  workspace: z.enum(["personal", "business"]).default("personal"),
  allowHighRisk: z.boolean().default(false),
  style: z.enum(["concise", "balanced", "detailed"]).optional(),
  personality: z.enum(["warm", "neutral", "precise"]).optional(),
  name: z.string().trim().max(80).optional(),
  region: z.string().trim().max(64).optional(),
});

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  // Throttle per user; on limit, fall back to the on-device engine so Ren still
  // answers (never a hard failure) while we shed LLM load.
  if (rateLimited(user.uid)) {
    console.log("[ren] rate-limited uid");
    return NextResponse.json({ mode: "deterministic" }, { status: 200 });
  }

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
    const result = await runRenAgent(ctx, b.message, b.history, { allowHighRisk: b.allowHighRisk, style: b.style, personality: b.personality, name: b.name, region: b.region });
    return NextResponse.json({ mode: "llm", ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("ren agent failed", err);
    // Fail safe: let the client fall back to the deterministic engine.
    return NextResponse.json({ mode: "deterministic", error: "REN is unavailable right now." }, { status: 200 });
  }
}
