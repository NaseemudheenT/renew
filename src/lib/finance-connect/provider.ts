/**
 * The single seam between Renew and any bank-data provider. Every provider
 * implements this interface; the finance UI only ever talks to it, so adding a
 * real provider (Yapily / TrueLayer / an RBI-AA TSP) later needs no UI change.
 *
 * Real providers run their network calls SERVER-SIDE only (API secrets never
 * reach the browser). The sandbox provider is the sole client-safe one and is
 * used purely to exercise the connect/consent/disconnect UX without a real bank.
 */

import type {
  UserBankConnection,
  BankAccount,
  AccountBalance,
  BankTransaction,
  Holding,
  ConnectionInit,
  ConsentScope,
  ConnectionKind,
} from "./types";

export interface ProviderInstitution {
  id: string;
  name: string;
  region: string;
  short: string;
  color: string;
}

export interface BankConnectionProvider {
  id: string;
  label: string;
  /** true once this returns a real, live, regulated feed. */
  live: boolean;

  /** Institutions this provider covers for a region + kind (empty if none). */
  listInstitutions(region: string, kind: ConnectionKind): Promise<ProviderInstitution[]>;

  /** Begin a connection: create a consent and return the provider auth URL. */
  createConnection(input: { uid: string; institutionId: string; region: string; kind: ConnectionKind; scopes: ConsentScope[] }): Promise<ConnectionInit>;

  /** Handle the provider redirect/callback and finalize the connection. */
  handleCallback(input: { connectionId: string; params: Record<string, string> }): Promise<UserBankConnection>;

  getAccounts(connectionId: string): Promise<BankAccount[]>;
  getBalances(connectionId: string): Promise<AccountBalance[]>;
  getTransactions(connectionId: string, opts?: { since?: number }): Promise<BankTransaction[]>;
  getHoldings(connectionId: string): Promise<Holding[]>;

  /** Refresh tokens / re-pull. */
  refreshConnection(connectionId: string): Promise<UserBankConnection>;

  /** Disconnect and revoke consent at the provider. */
  disconnect(connectionId: string): Promise<void>;
}

/**
 * Which provider Renew uses. Real providers are selected by server-side env
 * (e.g. RENEW_BANK_PROVIDER=yapily) once credentials exist; until then the
 * sandbox provider drives the UX. Imported lazily by callers to keep the
 * client bundle free of any real-provider server code.
 */
export function activeProviderId(): string {
  if (typeof process !== "undefined" && process.env.RENEW_BANK_PROVIDER) {
    return process.env.RENEW_BANK_PROVIDER;
  }
  return "sandbox";
}

export function isSandbox(): boolean {
  return activeProviderId() === "sandbox";
}
