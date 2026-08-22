/**
 * Renew's internal, provider-agnostic bank-connection schema. Every provider
 * (Yapily / TrueLayer internationally, an RBI Account-Aggregator TSP for India,
 * others later) is normalized into these shapes, so the finance UI never depends
 * on a specific provider. See [[renew-bank-connectivity]] in memory for the plan.
 *
 * SAFETY: Renew never stores bank credentials. Only consented, read-only data
 * and consent/connection metadata live here. Provider secrets stay server-side.
 */

export type ConnectionStatus =
  | "pending" // consent started, awaiting the user authorizing at the provider
  | "active" // authorized, syncing
  | "reauth_required" // token/consent expired — user must re-authorize
  | "revoked" // user revoked consent
  | "error"; // provider/connection error

export type AccountKind = "current" | "savings" | "credit_card" | "loan" | "investment" | "wallet" | "other";

/** A bank/UPI connection, or a brokerage/trading connection (Groww, Zerodha…). */
export type ConnectionKind = "bank" | "brokerage";

export interface UserBankConnection {
  id: string;
  kind: ConnectionKind;
  /** Provider adapter id, e.g. "sandbox", "yapily", "rbi-aa". */
  provider: string;
  /** true = test/sandbox connection (never real money). Always shown as such. */
  sandbox: boolean;
  institutionId: string;
  institutionName: string;
  region: string; // ISO-3166
  status: ConnectionStatus;
  consentId: string;
  createdAt: number;
  lastSyncedAt: number | null;
  updatedAt: number;
}

export interface BankAccount {
  id: string;
  connectionId: string;
  name: string;
  kind: AccountKind;
  currency: string;
  /** Masked identifier only — e.g. "•••• 4321". Never the full number. */
  maskedNumber: string;
}

export interface AccountBalance {
  accountId: string;
  current: number;
  available: number | null;
  currency: string;
  asOf: number;
}

export interface BankTransaction {
  id: string;
  accountId: string;
  /** Stable provider transaction id — used to dedupe on sync (idempotent). */
  providerTxId: string;
  amount: number; // signed: negative = money out
  currency: string;
  description: string;
  category: string | null;
  bookedAt: number;
}

/** A single investment holding from a connected brokerage. */
export interface Holding {
  id: string;
  connectionId: string;
  symbol: string;
  name: string;
  quantity: number;
  avgCost: number; // per unit, in `currency`
  lastPrice: number; // per unit
  currency: string;
}

export type ConsentScope = "accounts" | "balances" | "transactions" | "holdings";

export interface ConsentRecord {
  id: string;
  connectionId: string;
  provider: string;
  scopes: ConsentScope[];
  status: "granted" | "revoked" | "expired";
  grantedAt: number;
  /** Consent expiry (open-banking consents are time-boxed). */
  expiresAt: number | null;
  revokedAt: number | null;
}

export interface SyncStatus {
  connectionId: string;
  lastRunAt: number | null;
  lastSuccessAt: number | null;
  accountsSynced: number;
  transactionsSynced: number;
  error: string | null;
}

/** Result of kicking off a connection — where to send the user to authorize. */
export interface ConnectionInit {
  connectionId: string;
  consentId: string;
  /** URL to the provider's own secure authorization page (never Renew's). */
  authorizationUrl: string;
  sandbox: boolean;
}
