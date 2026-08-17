/**
 * RENEW — client-side CSV import for transactions.
 *
 * Parses a CSV (its own export format, or any file with recognizable headers),
 * maps rows to validated TransactionInputs, and flags likely duplicates against
 * existing data. Nothing is written here — the caller confirms, then persists.
 */

import type { TransactionInput } from "@/lib/firestore/transactions";
import type { Transaction, TxType } from "@/lib/types";

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
