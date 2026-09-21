import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/finance";
import type { TxType } from "@/lib/types";

/**
 * Pure embedding helpers with no server/client dependency — safe to import from
 * server routes, client code, and tests. The actual Voyage API calls live in
 * embeddings.server.ts (server-only).
 */

/**
 * Cosine similarity of two equal-length vectors, in [-1, 1]. Returns 0 for
 * mismatched/empty/zero vectors — never throws.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length === 0 || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i]!, y = b[i]!;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** The category "documents" (name + subcategories) embedded per transaction type. */
export function categoryDocs(type: TxType): { id: string; text: string }[] {
  const cats = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return cats.map((c) => ({ id: c.id, text: [c.label, ...(c.sub ?? [])].join(", ") }));
}
