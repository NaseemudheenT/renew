"use client";

import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "@/lib/finance";
import type { TxType } from "@/lib/types";

/**
 * Voice → transaction. A small, honest natural-language parser that turns a
 * spoken phrase ("spent five hundred on groceries") into a draft transaction the
 * person confirms. Nothing is invented — if it can't find an amount, it says so.
 */

/* ---- Speech recognition (Web Speech API) --------------------------------- */

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal?: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

export function getSpeechRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    (window as unknown as { SpeechRecognition?: SpeechRecognitionCtor }).SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition;
  if (!Ctor) return null;
  try {
    return new Ctor();
  } catch {
    return null;
  }
}

export function isVoiceSupported(): boolean {
  return getSpeechRecognition() !== null;
}

/* ---- Parsing ------------------------------------------------------------- */

const WORD_NUMBERS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, twenty: 20, thirty: 30,
  forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  hundred: 100, thousand: 1000, lakh: 100000, million: 1000000,
};

const INCOME_WORDS = ["received", "got", "earned", "salary", "income", "credited", "refund", "refunded", "deposit", "bonus"];

/** Keyword → category id, checked in order (first match wins). */
const CATEGORY_HINTS: { id: string; words: string[] }[] = [
  { id: "salary", words: ["salary", "paycheck", "wages"] },
  { id: "freelance", words: ["freelance", "client", "gig"] },
  { id: "groceries", words: ["grocery", "groceries", "supermarket", "vegetable", "fruit", "milk"] },
  { id: "food", words: ["food", "restaurant", "lunch", "dinner", "breakfast", "coffee", "snack", "eat", "cafe", "pizza", "swiggy", "zomato"] },
  { id: "transport", words: ["transport", "uber", "ola", "taxi", "cab", "fuel", "petrol", "diesel", "bus", "train", "metro", "ride", "auto"] },
  { id: "rent", words: ["rent", "landlord", "mortgage"] },
  { id: "bills", words: ["bill", "electricity", "water", "internet", "wifi", "recharge", "gas", "utility"] },
  { id: "shopping", words: ["shopping", "clothes", "amazon", "flipkart", "shoes", "shop", "mall"] },
  { id: "entertainment", words: ["movie", "netflix", "spotify", "game", "concert", "entertainment", "prime"] },
  { id: "health", words: ["health", "doctor", "medicine", "pharmacy", "hospital", "gym", "clinic"] },
  { id: "education", words: ["education", "course", "book", "school", "college", "tuition", "fees", "class"] },
  { id: "subscriptions", words: ["subscription", "membership", "plan"] },
  { id: "gift", words: ["gift", "present"] },
];

export interface ParsedTransaction {
  type: TxType;
  amount: number | null;
  category: string;
  note: string;
}

/** Best-effort parse of a spoken phrase into a draft transaction. */
export function parseSpokenTransaction(raw: string): ParsedTransaction {
  const text = raw.trim().toLowerCase();
  const type: TxType = INCOME_WORDS.some((w) => text.includes(w)) ? "income" : "expense";

  // Amount: prefer explicit digits (with commas), else assemble simple words.
  let amount: number | null = null;
  const digitMatch = text.replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  if (digitMatch) {
    amount = parseFloat(digitMatch[0]);
    // Scale by a following multiplier word (e.g. "2 thousand", "5 lakh").
    const after = text.slice(text.indexOf(digitMatch[0]) + digitMatch[0].length, text.indexOf(digitMatch[0]) + digitMatch[0].length + 12);
    if (/\bthousand|\bk\b/.test(after)) amount *= 1000;
    else if (/\blakh/.test(after)) amount *= 100000;
    else if (/\bmillion/.test(after)) amount *= 1000000;
  } else {
    // Assemble spelled-out numbers ("five hundred", "twelve").
    let total = 0;
    let current = 0;
    let found = false;
    for (const word of text.split(/\s+/)) {
      const n = WORD_NUMBERS[word];
      if (n === undefined) continue;
      found = true;
      if (n === 100 || n === 1000 || n === 100000 || n === 1000000) {
        current = (current || 1) * n;
        if (n >= 1000) { total += current; current = 0; }
      } else {
        current += n;
      }
    }
    if (found) amount = total + current;
  }

  const catList = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const catIds = new Set(catList.map((c) => c.id));
  let category = type === "income" ? "other_income" : "other_expense";
  for (const hint of CATEGORY_HINTS) {
    if (catIds.has(hint.id) && hint.words.some((w) => text.includes(w))) {
      category = hint.id;
      break;
    }
  }

  // Note: the phrase after "on"/"for", else the whole thing, capitalised.
  const onFor = raw.match(/\b(?:on|for|to|at)\s+(.+)$/i);
  const note = (onFor?.[1] ?? raw).trim().replace(/\.$/, "");

  return { type, amount, category, note: note.charAt(0).toUpperCase() + note.slice(1) };
}

/* ---- Ren: voice in (listen) + voice out (speak) -------------------------- */

/** True when the browser can speak (text → voice). */
export function speechOutputSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export interface Listener { stop(): void }

/**
 * Listen once and hand back the final transcript, then call onEnd. Returns a
 * handle to stop early, or null when recognition isn't supported. Pass
 * `onPartial` to receive the live (interim) transcript as the user speaks —
 * used by the Siri-style voice orb to show words appearing in real time.
 */
export function listen(
  opts: { lang?: string; onText: (text: string) => void; onPartial?: (text: string) => void; onError?: (e: unknown) => void; onEnd?: () => void },
): Listener | null {
  const rec = getSpeechRecognition();
  if (!rec) return null;
  rec.lang = opts.lang || (typeof navigator !== "undefined" ? navigator.language : "en-US") || "en-US";
  rec.interimResults = !!opts.onPartial;
  rec.continuous = false;
  rec.maxAlternatives = 1;
  rec.onresult = (e) => {
    const results = e.results;
    let finalText = "";
    let interim = "";
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const t = r?.[0]?.transcript ?? "";
      if (r?.isFinal) finalText += t;
      else interim += t;
    }
    const partial = (finalText + interim).trim();
    if (partial) opts.onPartial?.(partial);
    const done = finalText.trim();
    if (done) opts.onText(done);
  };
  rec.onerror = (e) => opts.onError?.(e);
  rec.onend = () => opts.onEnd?.();
  try { rec.start(); } catch { return null; }
  return { stop: () => { try { rec.stop(); } catch { /* already stopped */ } } };
}

/** The speaking voices available in this browser (may be empty until loaded). */
export function availableVoices(): SpeechSynthesisVoice[] {
  if (!speechOutputSupported()) return [];
  try { return window.speechSynthesis.getVoices(); } catch { return []; }
}

/** Notify when the voice list becomes available (some browsers load it async). */
export function onVoicesReady(cb: () => void): () => void {
  if (!speechOutputSupported()) return () => {};
  window.speechSynthesis.addEventListener?.("voiceschanged", cb);
  return () => window.speechSynthesis.removeEventListener?.("voiceschanged", cb);
}

/**
 * Speak a line in Ren's voice. Honors a chosen voice (voiceURI) and rate from
 * the user's Ren settings; falls back to a voice matching the language. No-op
 * when synthesis isn't available.
 */
export function speak(text: string, opts: { lang?: string; voiceURI?: string; rate?: number; onEnd?: () => void } = {}): void {
  if (!speechOutputSupported() || !text) { opts.onEnd?.(); return; }
  try {
    window.speechSynthesis.cancel(); // never overlap
    const u = new SpeechSynthesisUtterance(text);
    u.lang = opts.lang || (typeof navigator !== "undefined" ? navigator.language : "en-US") || "en-US";
    u.rate = opts.rate && opts.rate > 0 ? opts.rate : 1;
    u.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const chosen = opts.voiceURI ? voices.find((v) => v.voiceURI === opts.voiceURI) : undefined;
    const match = chosen ?? voices.find((v) => v.lang?.startsWith(u.lang.slice(0, 2)));
    if (match) u.voice = match;
    if (opts.onEnd) { u.onend = () => opts.onEnd?.(); u.onerror = () => opts.onEnd?.(); }
    window.speechSynthesis.speak(u);
  } catch { opts.onEnd?.(); /* speech is a nicety — never throw */ }
}

export function stopSpeaking(): void {
  if (speechOutputSupported()) { try { window.speechSynthesis.cancel(); } catch { /* ignore */ } }
}
