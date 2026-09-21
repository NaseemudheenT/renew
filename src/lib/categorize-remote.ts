"use client";

import type { TxType } from "@/lib/types";

/**
 * Ask the server for a smarter (embeddings-based) category — used ONLY as a
 * fallback when the on-device keyword/learned pass is unsure, so it stays cheap.
 * Returns null on any failure so the caller keeps its local guess.
 */
export async function embedCategorize(text: string, type: TxType): Promise<{ category: string; score: number } | null> {
  const t = (text || "").trim();
  if (!t) return null;
  try {
    const res = await fetch("/api/categorize", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: t, type }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { ok?: boolean; category?: string; score?: number };
    if (!data.ok || !data.category) return null;
    return { category: data.category, score: typeof data.score === "number" ? data.score : 0 };
  } catch {
    return null;
  }
}
