import { z } from "zod";

/**
 * REN tool argument schemas — strict runtime validation for everything the AI
 * (or the deterministic engine) asks REN to do. The model's output NEVER reaches
 * the data layer without passing one of these first (spec §11). Amounts are
 * positive magnitudes; the transaction's own currency defaults to the user's.
 */

export const timeframeSchema = z
  .enum(["today", "yesterday", "this_week", "last_week", "this_month", "last_month", "this_year", "all"])
  .describe("A natural time range, resolved in the user's timezone.");

export const txTypeSchema = z.enum(["income", "expense"]);

/** ISO-4217-ish: 3 uppercase letters. Optional — defaults to the user's currency. */
export const currencySchema = z.string().trim().length(3).regex(/^[A-Z]{3}$/, "3-letter currency code").optional();

/* ---- Read / analytical tool args ---------------------------------------- */

export const getSummaryArgs = z.object({
  timeframe: timeframeSchema.default("this_month"),
});

export const searchTransactionsArgs = z.object({
  query: z.string().trim().max(120).optional().describe("Merchant/note/category text to match."),
  type: txTypeSchema.optional(),
  category: z.string().trim().max(40).optional(),
  timeframe: timeframeSchema.default("this_month"),
  limit: z.number().int().min(1).max(50).default(10),
});

export const analyzeSpendingArgs = z.object({
  timeframe: timeframeSchema.default("this_month"),
  category: z.string().trim().max(40).optional(),
});

export const comparePeriodsArgs = z.object({
  category: z.string().trim().max(40).optional(),
});

export const affordabilityArgs = z.object({
  amount: z.number().positive().describe("The cost the user is considering."),
});

/* ---- Write tool args ----------------------------------------------------- */

export const createTransactionArgs = z.object({
  type: txTypeSchema,
  amount: z.number().positive().describe("Positive magnitude."),
  currency: currencySchema,
  category: z.string().trim().min(1).max(40).describe("A Renew category id."),
  note: z.string().trim().max(140).optional(),
  /** Natural date phrase ('yesterday') or ISO date; resolved in the user's tz. */
  date: z.string().trim().max(40).optional(),
});

export const updateTransactionArgs = z.object({
  id: z.string().trim().min(1),
  amount: z.number().positive().optional(),
  category: z.string().trim().min(1).max(40).optional(),
  note: z.string().trim().max(140).optional(),
  date: z.string().trim().max(40).optional(),
});

export const deleteTransactionArgs = z.object({
  id: z.string().trim().min(1),
});

export const createReminderArgs = z.object({
  title: z.string().trim().min(1).max(120),
  date: z.string().trim().max(40).describe("When to be reminded (natural or ISO)."),
  time: z.string().trim().regex(/^\d{1,2}:\d{2}$/).optional(),
});

export const createBudgetArgs = z.object({
  category: z.string().trim().min(1).max(40),
  amount: z.number().positive(),
  currency: currencySchema,
});

export const createSavingsGoalArgs = z.object({
  name: z.string().trim().min(1).max(80),
  target: z.number().positive(),
  currency: currencySchema,
});

export type CreateTransactionArgs = z.infer<typeof createTransactionArgs>;
export type SearchTransactionsArgs = z.infer<typeof searchTransactionsArgs>;
