/**
 * RENEW — auto-categorization engine (Tech Reference §2 + §6).
 *
 * Deterministic, on-device, FREE — no AI call. It scores a transaction's
 * description and decides how confident we are:
 *
 *   score = exact_merchant_match × 100      (a merchant this user already taught us)
 *         + keyword_match_count  × 15       (built-in merchant/keyword hits)
 *         + past_user_correction × 50       (a fuzzy match to a learned merchant)
 *
 *   score >= 80  → "auto"     assign silently
 *   score 40–79  → "suggest"  assign but show as tap-to-fix
 *   score <  40  → "ask"      leave it for the user (or an AI fallback later)
 *
 * The per-user learned table (merchant → category) is what makes it get smarter
 * over time without ever calling a model: every time the user saves an entry, we
 * remember "this description → that category", so next time it's an exact match.
 * Messy text ("SWIGGY*BANGALORE") is matched to a learned merchant with
 * Levenshtein similarity (§6).
 */

import { keywordCategory } from "@/lib/import";
import type { TxType } from "@/lib/types";

export type Confidence = "auto" | "suggest" | "ask";

export interface CategoryGuess {
  category: string;
  score: number;
  confidence: Confidence;
  source: "learned" | "keyword" | "none";
}

/** Levenshtein edit distance (§6) — classic DP, small strings only. */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j]! + 1, curr[j - 1]! + 1, prev[j - 1]! + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length]!;
}

/** Similarity in [0,1]: 1 = identical, 0 = completely different (§6). */
export function fuzzyRatio(a: string, b: string): number {
  const m = Math.max(a.length, b.length);
  if (m === 0) return 1;
  return 1 - editDistance(a, b) / m;
}

/** Normalise a description to a stable merchant key: lowercase, alphanumerics
 *  and single spaces only, trimmed and capped. Safe as an object key. */
export function merchantKey(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 48);
}

const FUZZY_THRESHOLD = 0.7;

/**
 * Categorize a description. `learned` is the user's merchantKey → categoryId map.
 * Pure and synchronous — safe to call on every keystroke.
 */
export function categorize(
  text: string,
  type: TxType,
  learned: Record<string, string> = {},
): CategoryGuess {
  const key = merchantKey(text);
  if (!key) {
    return { category: type === "income" ? "other_income" : "other_expense", score: 0, confidence: "ask", source: "none" };
  }

  // Learned memory: exact key match is an "exact merchant" the user taught us.
  let exact = 0;
  let correction = 0;
  let learnedCat: string | undefined = learned[key];
  if (learnedCat) {
    exact = 100; // exact_merchant_match
    correction = 50; // past_user_correction_match
  } else {
    // Fuzzy match to a learned merchant for messy OCR/SMS text (§6).
    let best = 0;
    for (const k of Object.keys(learned)) {
      const r = fuzzyRatio(key, k);
      if (r >= FUZZY_THRESHOLD && r > best) { best = r; learnedCat = learned[k]; }
    }
    if (learnedCat) correction = 50;
  }

  // Built-in keyword pass.
  const { category: kwCat, hits } = keywordCategory(text, type);
  const keyword = hits * 15;

  const category = learnedCat ?? kwCat;
  const score = exact + keyword + correction;
  const confidence: Confidence = score >= 80 ? "auto" : score >= 40 ? "suggest" : "ask";
  const source: CategoryGuess["source"] = learnedCat ? "learned" : hits > 0 ? "keyword" : "none";
  return { category, score, confidence, source };
}
