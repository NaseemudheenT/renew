import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { voyageConfigured } from "@/lib/embeddings.server";
import { bestCategoryByEmbedding } from "@/lib/category-embeddings.server";

export const runtime = "nodejs";

/**
 * Smarter categorization fallback (Tech Ref §4 Step 5). The client tries its
 * fast on-device keyword/learned pass first and only calls this when it's unsure
 * — so Voyage is a cheap fallback, not a per-keystroke cost. Returns a category
 * + cosine score; the client applies its own accept threshold. Fails soft:
 * `{ ok:false }` when embeddings are unavailable so the client keeps its guess.
 */

const bodySchema = z.object({
  text: z.string().trim().min(1).max(200),
  type: z.enum(["income", "expense"]),
});

// Best-effort per-user throttle (per instance) to cap cost.
const RATE_MAX = 40;
const RATE_WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();
function rateLimited(uid: string): boolean {
  const now = Date.now();
  const recent = (hits.get(uid) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(uid, recent);
  return recent.length > RATE_MAX;
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  if (!voyageConfigured() || rateLimited(user.uid)) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  let json: unknown;
  try { json = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 }); }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });

  try {
    const match = await bestCategoryByEmbedding(parsed.data.text, parsed.data.type);
    if (!match) return NextResponse.json({ ok: false }, { status: 200 });
    return NextResponse.json({ ok: true, category: match.category, score: match.score }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[categorize] failed", err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
