import "server-only";
import { getServerEnv } from "@/lib/env";
import { cosineSimilarity } from "@/lib/embeddings-core";

export { cosineSimilarity };

/**
 * Voyage AI embeddings — server-only (the key never reaches the browser).
 * Used for smarter categorization and semantic search. Everything degrades
 * gracefully: if the key is missing or the API errors, callers fall back to the
 * on-device keyword/learned categorizer and plain-text search.
 *
 * Current recommended model: voyage-3.5-lite (fast, cheap, strong) — set
 * VOYAGE_MODEL to override. input_type distinguishes stored "document" vectors
 * from "query" vectors, which improves retrieval quality per Voyage's guidance.
 */

const API_URL = "https://api.voyageai.com/v1/embeddings";

export function voyageConfigured(): boolean {
  return !!getServerEnv().voyageApiKey;
}

type InputType = "document" | "query";

async function embed(texts: string[], inputType: InputType): Promise<number[][] | null> {
  const { voyageApiKey, voyageModel } = getServerEnv();
  if (!voyageApiKey || texts.length === 0) return null;
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${voyageApiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: voyageModel,
        input: texts,
        input_type: inputType,
        // Compact float vectors keep payloads small; default dim for the model.
        output_dtype: "float",
      }),
    });
    if (!res.ok) {
      console.error("[voyage] status", res.status, (await res.text().catch(() => "")).slice(0, 200));
      return null;
    }
    const data = (await res.json()) as { data?: { embedding: number[]; index: number }[] };
    if (!data.data || data.data.length !== texts.length) return null;
    // Preserve input order (Voyage returns an index per item).
    const out = new Array<number[]>(texts.length);
    for (const row of data.data) out[row.index] = row.embedding;
    return out.every(Boolean) ? out : null;
  } catch (err) {
    console.error("[voyage] embed failed", err);
    return null;
  }
}

/** Embed texts to be STORED/compared against (categories, cached transactions). */
export function embedDocuments(texts: string[]): Promise<number[][] | null> {
  return embed(texts, "document");
}

/** Embed a single search/transaction text used to look things up. */
export async function embedQuery(text: string): Promise<number[] | null> {
  const r = await embed([text], "query");
  return r ? r[0]! : null;
}
