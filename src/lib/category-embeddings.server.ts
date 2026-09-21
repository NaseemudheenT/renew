import "server-only";
import { embedDocuments, embedQuery } from "@/lib/embeddings.server";
import { cosineSimilarity, categoryDocs } from "@/lib/embeddings-core";
import type { TxType } from "@/lib/types";

export { categoryDocs };

/**
 * Semantic categorization with Voyage embeddings (Tech Ref §4 Step 5). Each
 * built-in category becomes a short "document" (its name + subcategories); a
 * transaction description is embedded as a query and matched by cosine
 * similarity. This understands meaning — "Swiggy", "Zomato", "cafe" all land on
 * Food & Drink without hardcoding merchants. Used only as the fallback when the
 * fast on-device keyword/learned pass is unsure, so it stays cheap.
 */

// Category vectors are stable, so cache them per server instance (first use of a
// type pays the embed cost; later requests reuse it).
const cache = new Map<TxType, { ids: string[]; vectors: number[][] }>();

async function getCategoryVectors(type: TxType) {
  const cached = cache.get(type);
  if (cached) return cached;
  const docs = categoryDocs(type);
  const vectors = await embedDocuments(docs.map((d) => d.text));
  if (!vectors) return null;
  const result = { ids: docs.map((d) => d.id), vectors };
  cache.set(type, result);
  return result;
}

/**
 * Best category for a description via embeddings, or null if unavailable/unsure.
 * `score` is cosine similarity in [-1,1]; callers apply their own threshold.
 */
export async function bestCategoryByEmbedding(
  text: string,
  type: TxType,
): Promise<{ category: string; score: number } | null> {
  const q = (text || "").trim();
  if (!q) return null;
  const cats = await getCategoryVectors(type);
  if (!cats) return null;
  const qv = await embedQuery(q);
  if (!qv) return null;
  let bestId = "";
  let best = -1;
  for (let i = 0; i < cats.ids.length; i++) {
    const s = cosineSimilarity(qv, cats.vectors[i]!);
    if (s > best) { best = s; bestId = cats.ids[i]!; }
  }
  return bestId ? { category: bestId, score: best } : null;
}
