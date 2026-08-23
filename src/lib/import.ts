/**
 * RENEW — client-side CSV import for transactions.
 *
 * Parses a CSV (its own export format, or any file with recognizable headers),
 * maps rows to validated TransactionInputs, and flags likely duplicates against
 * existing data. Nothing is written here — the caller confirms, then persists.
 */

import type { TransactionInput } from "@/lib/firestore/transactions";
import type { Transaction, TxType } from "@/lib/types";

/* ---- Smart extraction (statement/CSV → reviewable drafts) ----------------- */

/** Keyword → expense/income category id, first match wins. Deterministic. */
const CATEGORY_HINTS: { id: string; words: string[] }[] = [
  { id: "salary", words: ["salary", "payroll", "wages"] },
  { id: "groceries", words: ["grocery", "groceries", "supermarket", "mart", "bigbasket", "dmart", "reliance fresh"] },
  { id: "food", words: ["restaurant", "cafe", "coffee", "swiggy", "zomato", "food", "pizza", "hotel", "bakery"] },
  { id: "transport", words: ["uber", "ola", "fuel", "petrol", "diesel", "metro", "irctc", "railway", "cab", "taxi", "toll", "parking"] },
  { id: "rent", words: ["rent", "landlord"] },
  { id: "bills", words: ["electricity", "power", "water bill", "gas", "broadband", "internet", "wifi", "mobile", "recharge", "bill", "dth", "airtel", "jio"] },
  { id: "shopping", words: ["amazon", "flipkart", "myntra", "shopping", "store", "mall"] },
  { id: "entertainment", words: ["netflix", "spotify", "prime", "hotstar", "movie", "bookmyshow", "youtube"] },
  { id: "health", words: ["pharmacy", "hospital", "clinic", "medical", "apollo", "doctor", "medicine"] },
  { id: "education", words: ["school", "college", "tuition", "course", "udemy", "fees"] },
  { id: "subscriptions", words: ["subscription", "membership"] },
];

/** Best-effort category from a description. Never invents amounts — labels only. */
export function guessCategory(text: string, type: TxType): string {
  const s = (text || "").toLowerCase();
  if (type === "income") {
    if (/salary|payroll/.test(s)) return "salary";
    if (/refund|reversal/.test(s)) return "refund";
    if (/interest/.test(s)) return "investment";
    return "other_income";
  }
  for (const h of CATEGORY_HINTS) {
    if (h.id === "salary") continue;
    if (h.words.some((w) => s.includes(w))) return h.id;
  }
  return "other_expense";
}

export interface ColumnMapping {
  date: string | null;
  amount: string | null; // a single signed amount column
  debit: string | null; // separate debit column
  credit: string | null; // separate credit column
  description: string | null;
}

/** Auto-detect which CSV columns hold date / amount / debit / credit / desc. */
export function detectMapping(headers: string[]): ColumnMapping {
  const find = (...needles: string[]) =>
    headers.find((h) => needles.some((n) => h.includes(n))) ?? null;
  return {
    date: find("date", "posted", "transaction date", "value date"),
    debit: find("debit", "withdrawal", "paid out", "money out"),
    credit: find("credit", "deposit", "paid in", "money in"),
    amount: find("amount", "value"),
    description: find("description", "narration", "particulars", "merchant", "details", "note", "remarks"),
  };
}

export interface DraftRow {
  id: string;
  include: boolean;
  duplicate: boolean;
  date: number;
  type: TxType;
  amount: number;
  category: string;
  note: string;
  currency: string;
}

function num(raw: string | undefined): number {
  if (!raw) return NaN;
  const cleaned = raw.replace(/[^0-9.\-]/g, "");
  return cleaned === "" ? NaN : Number(cleaned);
}

/** Turn parsed rows into editable, de-duplicated draft transactions to review. */
export function buildDrafts(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
  existing: Transaction[],
  fallbackCurrency: string,
): DraftRow[] {
  const seen = new Set(existing.map(signature));
  const drafts: DraftRow[] = [];
  rows.forEach((row, i) => {
    const date = parseDate(mapping.date ? row[mapping.date] ?? "" : "");
    if (date === null) return;

    let amount = NaN;
    let type: TxType = "expense";
    if (mapping.debit || mapping.credit) {
      const debit = mapping.debit ? num(row[mapping.debit]) : NaN;
      const credit = mapping.credit ? num(row[mapping.credit]) : NaN;
      if (Number.isFinite(credit) && credit > 0) { amount = credit; type = "income"; }
      else if (Number.isFinite(debit) && debit > 0) { amount = debit; type = "expense"; }
    } else if (mapping.amount) {
      const raw = num(row[mapping.amount]);
      if (Number.isFinite(raw)) { amount = Math.abs(raw); type = raw < 0 ? "expense" : "income"; }
    }
    if (!Number.isFinite(amount) || amount <= 0) return;

    const note = (mapping.description ? row[mapping.description] ?? "" : "").trim();
    const category = guessCategory(note, type);
    const sig = signature({ type, amount, category, date, note });
    const duplicate = seen.has(sig);
    seen.add(sig);
    drafts.push({
      id: `draft-${i}`,
      include: !duplicate,
      duplicate,
      date,
      type,
      amount,
      category,
      note,
      currency: fallbackCurrency,
    });
  });
  return drafts;
}

/** Parse CSV text into header-keyed rows (RFC-4180: quotes, escaped quotes, newlines). */
export function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const headerRow = rows[0];
  if (!headerRow) return [];
  const headers = headerRow.map((h) => h.trim().toLowerCase());
  return rows
    .slice(1)
    .filter((r) => r.some((v) => v.trim() !== ""))
    .map((r) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        obj[h] = (r[idx] ?? "").trim();
      });
      return obj;
    });
}

function parseDate(raw: string): number | null {
  if (!raw) return null;
  if (/^\d+$/.test(raw)) {
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }
  const t = Date.parse(raw);
  return Number.isNaN(t) ? null : t;
}

function parseType(raw: string): TxType {
  return raw.toLowerCase() === "income" ? "income" : "expense";
}

export interface ImportResult {
  valid: TransactionInput[];
  invalid: number;
  duplicates: number;
}

/** A stable-ish signature used to skip re-importing the same transaction. */
function signature(t: { type: string; amount: number; category: string; date: number; note?: string }) {
  const day = new Date(t.date);
  const dayKey = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
  return `${t.type}|${t.amount}|${t.category}|${dayKey}|${(t.note ?? "").trim().toLowerCase()}`;
}

/**
 * Map parsed rows to TransactionInputs, dropping invalid rows and those that
 * duplicate an existing transaction. `fallbackCurrency` fills a missing column.
 */
export function rowsToTransactions(
  rows: Record<string, string>[],
  existing: Transaction[],
  fallbackCurrency: string,
): ImportResult {
  const seen = new Set(existing.map(signature));
  const valid: TransactionInput[] = [];
  let invalid = 0;
  let duplicates = 0;

  for (const row of rows) {
    const amount = Math.abs(Number(row.amount));
    const date = parseDate(row.date ?? "");
    if (!Number.isFinite(amount) || amount <= 0 || date === null) {
      invalid++;
      continue;
    }
    const type = parseType(row.type ?? "");
    const category = row.category || (type === "income" ? "other_income" : "other_expense");
    const currency = (row.currency || fallbackCurrency).toUpperCase().slice(0, 3);
    const note = row.note || undefined;

    const sig = signature({ type, amount, category, date, note });
    if (seen.has(sig)) {
      duplicates++;
      continue;
    }
    seen.add(sig);
    valid.push({ type, amount, currency, category, note, date });
  }

  return { valid, invalid, duplicates };
}
