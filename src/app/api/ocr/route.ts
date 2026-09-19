import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { getServerEnv } from "@/lib/env";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/finance";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Receipt/bill scanning with a vision-capable Claude model (Tech Reference §1).
 * The image is sent to Anthropic which returns STRICT JSON — amount, merchant,
 * date, category and a self-reported confidence. This understands receipt
 * structure far better than on-device OCR, and it NEVER invents: if it can't
 * read a field it returns null and a low confidence, so the client can ask the
 * user instead of guessing. The image stays server-side; the key never ships.
 */

const API_URL = "https://api.anthropic.com/v1/messages";

const bodySchema = z.object({
  // data URL: "data:image/jpeg;base64,...."
  image: z.string().startsWith("data:").max(8_000_000),
});

// Best-effort per-user throttle (shared-nothing, per instance) to cap cost.
const RATE_MAX = 20;
const RATE_WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();
function rateLimited(uid: string): boolean {
  const now = Date.now();
  const recent = (hits.get(uid) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(uid, recent);
  return recent.length > RATE_MAX;
}

interface VisionResult {
  amount: number | null;
  merchant: string | null;
  date: string | null;
  category: string | null;
  confidence: number;
}

function parseDataUrl(dataUrl: string): { mediaType: string; data: string } | null {
  const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s.exec(dataUrl);
  if (!m) return null;
  return { mediaType: m[1]!, data: m[2]! };
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });

  const env = getServerEnv();
  if (!env.anthropicApiKey) {
    // No key → tell the client to fall back to the on-device engine.
    return NextResponse.json({ ok: false, mode: "unavailable" }, { status: 200 });
  }
  if (rateLimited(user.uid)) {
    return NextResponse.json({ ok: false, mode: "unavailable" }, { status: 200 });
  }

  let json: unknown;
  try { json = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 }); }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid image." }, { status: 400 });

  const img = parseDataUrl(parsed.data.image);
  if (!img) return NextResponse.json({ ok: false, error: "Invalid image." }, { status: 400 });

  const expenseIds = EXPENSE_CATEGORIES.map((c) => c.id).join(", ");
  const incomeIds = INCOME_CATEGORIES.map((c) => c.id).join(", ");
  const today = new Date().toISOString().slice(0, 10);

  const prompt = [
    "You are a precise receipt/bill reader for a finance app. Read ONLY what is actually printed in this image.",
    "Return STRICT JSON and nothing else, in exactly this shape:",
    '{"amount": number|null, "merchant": string|null, "date": "YYYY-MM-DD"|null, "type": "expense"|"income", "category": string|null, "confidence": number}',
    "- amount: the FINAL grand total actually paid (the largest clearly-labelled total), as a plain number, no currency symbol. If you cannot read it clearly, use null.",
    "- merchant: the shop/biller name from the top of the receipt. null if unreadable.",
    `- date: the transaction date printed on the receipt in YYYY-MM-DD. If none is visible, use null (do NOT default to today; today is ${today} only for your reference).`,
    "- type: 'expense' for a normal purchase/bill receipt (the usual case), 'income' only if it is clearly a payment received/payslip.",
    `- category: choose the single best-fitting id. Expense ids: ${expenseIds}. Income ids: ${incomeIds}. If unsure use "other_expense" (or "other_income").`,
    "- confidence: your honest 0..1 confidence that amount+merchant are correct. Be strict: blurry, partial, or non-receipt images should be well below 0.5.",
    "NEVER invent a value to look helpful. A null with low confidence is correct when the image is unclear. Output JSON only, no prose, no code fences.",
  ].join("\n");

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "x-api-key": env.anthropicApiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: env.renModel,
        max_tokens: 400,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: img.mediaType, data: img.data } },
            { type: "text", text: prompt },
          ],
        }],
      }),
    });
    if (!res.ok) {
      console.error("[ocr] anthropic status", res.status);
      return NextResponse.json({ ok: false, mode: "unavailable" }, { status: 200 });
    }
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = (data.content ?? []).filter((b) => b.type === "text").map((b) => b.text ?? "").join("").trim();
    const jsonText = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    let out: (VisionResult & { type?: string }) | null = null;
    try { out = JSON.parse(jsonText); } catch { out = null; }
    if (!out || typeof out !== "object") {
      return NextResponse.json({ ok: false, mode: "unreadable" }, { status: 200 });
    }
    const amount = typeof out.amount === "number" && isFinite(out.amount) && out.amount > 0 ? out.amount : null;
    const confidence = typeof out.confidence === "number" ? Math.max(0, Math.min(1, out.confidence)) : 0;
    const type = out.type === "income" ? "income" : "expense";
    return NextResponse.json({
      ok: true,
      amount,
      merchant: typeof out.merchant === "string" ? out.merchant.slice(0, 80) : null,
      date: typeof out.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(out.date) ? out.date : null,
      type,
      category: typeof out.category === "string" ? out.category.slice(0, 40) : null,
      confidence,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[ocr] failed", err);
    return NextResponse.json({ ok: false, mode: "unavailable" }, { status: 200 });
  }
}
