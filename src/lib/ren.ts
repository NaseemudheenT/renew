import type { TxType } from "@/lib/types";
import { parseAmountInQuestion } from "@/lib/ask";
import { guessCategory } from "@/lib/import";

/**
 * REN — Renew's finance assistant brain.
 *
 * Ren understands two things a person says (typed or spoken):
 *   1. a COMMAND to record money — "spent 500 on groceries", "got 50k salary"
 *   2. a QUESTION about their money — handled by lib/ask (answerQuestion)
 *
 * This module only does (1): turn a sentence into a transaction draft. It's
 * deterministic — the amount is parsed, the category guessed from the same
 * merchant dictionary as import, and income vs expense inferred from the verb.
 * No LLM, no network, always correct arithmetic. Returns null when the text
 * isn't a record-money command (the caller then tries answerQuestion).
 */

export interface MoneyDraft {
  type: TxType;
  amount: number;
  /** Category id (see lib/finance). */
  category: string;
  /** A short human note (merchant / what it was), may be empty. */
  note: string;
}

/**
 * REN ACTIONS — the "Siri for Renew" layer. Ren can DO things in the app, not
 * just answer: switch the theme, open any section. Deterministic and safe — only
 * navigation and appearance, never anything that spends or deletes without the
 * normal confirmation. Returns null when the text isn't an action command.
 */
export type RenAction =
  | { kind: "theme"; theme: "light" | "dark" | "toggle"; label: string }
  | { kind: "navigate"; href: string; label: string };

const NAV_TARGETS: { re: RegExp; href: string; label: string }[] = [
  { re: /\b(dashboard|overview|home\s*screen|home\s*page)\b/, href: "/dashboard", label: "Dashboard" },
  { re: /\b(transactions?|history)\b/, href: "/transactions", label: "Transactions" },
  { re: /\b(budgets?)\b/, href: "/budget", label: "Budgets" },
  { re: /\b(savings?|goals?)\b/, href: "/savings", label: "Savings" },
  { re: /\b(bills?|payments?|subscriptions?)\b/, href: "/payments", label: "Bills" },
  { re: /\b(accounts?)\b/, href: "/accounts", label: "Accounts" },
  { re: /\b(analytics|analysis|insights?|reports?)\b/, href: "/analytics", label: "Analytics" },
  { re: /\b(calendar)\b/, href: "/calendar", label: "Calendar" },
  { re: /\b(invoices?)\b/, href: "/invoices", label: "Invoices" },
  { re: /\b(settings?|preferences?)\b/, href: "/settings", label: "Settings" },
];

/**
 * Detect an in-app action ("switch to dark mode", "open my budgets"). Checked
 * before recording money or answering, so Ren acts like an assistant.
 */
export function parseRenAction(text: string): RenAction | null {
  const t = (text ?? "").toLowerCase().trim();
  if (!t) return null;

  // THEME — appearance words or an intent verb, plus a direction (or a bare
  // "change the theme" which toggles).
  const wantsAppearance = /\b(theme|mode|appearance)\b/.test(t);
  const themeVerb = /\b(change|switch|turn|set|make|go|enable|use|activate|toggle|flip)\b/.test(t);
  if (wantsAppearance || themeVerb) {
    const dark = /\b(dark|night|black)\b/.test(t);
    const light = /\b(light|day|bright|white)\b/.test(t);
    if (dark && !light) return { kind: "theme", theme: "dark", label: "dark mode" };
    if (light && !dark) return { kind: "theme", theme: "light", label: "light mode" };
    if (wantsAppearance && themeVerb) return { kind: "theme", theme: "toggle", label: "the theme" };
  }

  // NAVIGATION — only on an explicit "open / go to / take me to" verb, so a
  // question like "how much on bills?" is never hijacked into a page change.
  if (/\b(open|go\s*to|goto|take me to|navigate|jump to|bring up)\b/.test(t)) {
    for (const n of NAV_TARGETS) if (n.re.test(t)) return { kind: "navigate", href: n.href, label: n.label };
  }
  return null;
}

// Looks like a question, not a command to record money.
const QUESTION_RE = /^(how|what|when|why|where|which|who|can|could|do|did|does|am|is|are|will|should|show|tell|list)\b|\?\s*$/i;

// Words that mean money came IN.
const INCOME_RE = /\b(got|get|received|receive|earned?|income|salary|salaried|credited?|deposit(ed)?|refund(ed)?|bonus|cashback|interest|dividend|invoice|freelance|paid me|client paid)\b/i;

// Words that mean money went OUT (also the default for a bare "500 coffee").
const EXPENSE_RE = /\b(spent|spend|paid|pay|bought|buy|purchase[ds]?|add(ed)?|expense|cost|bill|for|on)\b/i;

/**
 * Parse a natural-language money command into a transaction draft, or null if
 * the text is a question / not an amount command.
 */
export function parseMoneyCommand(text: string): MoneyDraft | null {
  const raw = (text ?? "").trim();
  if (!raw) return null;
  if (QUESTION_RE.test(raw)) return null;

  const amount = parseAmountInQuestion(raw);
  if (amount == null || amount <= 0) return null;

  const lower = raw.toLowerCase();
  // Income only when an income word is present AND it doesn't read like a spend.
  const looksIncome = INCOME_RE.test(lower) && !/\b(spent|paid|bought|on)\b/.test(lower);
  const type: TxType = looksIncome ? "income" : "expense";

  // Build a note: drop the amount token and the command/filler words.
  const note = raw
    .replace(/(?:rs\.?|inr|₹|\$|usd)?\s*\d[\d,]*(?:\.\d+)?\s*(k|lakhs?|cr|crores?)?/i, " ")
    .replace(EXPENSE_RE, " ")
    .replace(INCOME_RE, " ")
    .replace(/\b(a|an|the|of|to|rs|rupees?|dollars?|inr|usd|me|my|today|yesterday|just|now|please)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  const category = guessCategory(note || raw, type);
  return { type, amount, category, note };
}
