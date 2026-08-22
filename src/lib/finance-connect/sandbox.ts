"use client";

import { institutionsForRegion } from "@/lib/bank/banks";
import type { BankConnectionProvider, ProviderInstitution } from "./provider";
import type {
  UserBankConnection,
  BankAccount,
  AccountBalance,
  BankTransaction,
  Holding,
  ConnectionInit,
  ConnectionKind,
} from "./types";

/** Brokerage / trading apps for the sandbox (a curated, region-aware set). */
const BROKERS: (ProviderInstitution & { regions?: string[] })[] = [
  { id: "groww", name: "Groww", short: "Gr", color: "#00D09C", region: "IN", regions: ["IN"] },
  { id: "zerodha", name: "Zerodha", short: "Ze", color: "#387ED1", region: "IN", regions: ["IN"] },
  { id: "tickertape", name: "Tickertape", short: "Tt", color: "#00BAF2", region: "IN", regions: ["IN"] },
  { id: "upstox", name: "Upstox", short: "Up", color: "#6C2BD9", region: "IN", regions: ["IN"] },
  { id: "angelone", name: "Angel One", short: "A1", color: "#E4572E", region: "IN", regions: ["IN"] },
  { id: "robinhood", name: "Robinhood", short: "Rh", color: "#00C805", region: "US", regions: ["US"] },
  { id: "etoro", name: "eToro", short: "eT", color: "#22C55E", region: "GB" },
  { id: "coinbase", name: "Coinbase", short: "Cb", color: "#0052FF", region: "US" },
];

function brokersForRegion(region: string): ProviderInstitution[] {
  const local = BROKERS.filter((b) => b.regions?.includes(region));
  const global = BROKERS.filter((b) => !b.regions);
  const others = BROKERS.filter((b) => b.regions && !b.regions.includes(region));
  return [...local, ...global, ...others].map(({ regions: _r, ...rest }) => rest);
}

/**
 * SANDBOX provider — drives the entire connect / consent / callback / disconnect
 * / revoke experience with NO real bank and NO backend. All state lives in
 * localStorage, isolated from the real app (the dashboard never reads it), and
 * every screen shows a clear "Sandbox" badge. This exists to test the UX safely;
 * a real provider (server-side) replaces it behind the same interface. It is
 * never used to present fabricated money as real.
 */

const KEY = "renew-sandbox-bank";

interface Stored {
  connection: UserBankConnection;
  accounts: BankAccount[];
  balances: AccountBalance[];
  transactions: BankTransaction[];
  holdings: Holding[];
}

function readAll(): Stored[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Stored[];
  } catch {
    return [];
  }
}
function writeAll(rows: Stored[]) {
  localStorage.setItem(KEY, JSON.stringify(rows));
  window.dispatchEvent(new Event("renew-sandbox-bank-change"));
}
function find(id: string): Stored | undefined {
  return readAll().find((r) => r.connection.id === id);
}
function upsert(row: Stored) {
  const rows = readAll().filter((r) => r.connection.id !== row.connection.id);
  rows.push(row);
  writeAll(rows);
}

export function listSandboxConnections(): UserBankConnection[] {
  return readAll().map((r) => r.connection).sort((a, b) => b.createdAt - a.createdAt);
}
export function getSandboxDetail(id: string): Stored | undefined {
  return find(id);
}
/** Synchronous institution list for the connect UI (bank or brokerage). */
export function sandboxInstitutions(region: string, kind: ConnectionKind): ProviderInstitution[] {
  if (kind === "brokerage") return brokersForRegion(region);
  return institutionsForRegion(region).map((i) => ({ id: i.id, name: i.name, region, short: i.short, color: i.color }));
}

const id = () => `sbx_${Math.random().toString(36).slice(2, 10)}`;
const DAY = 86_400_000;

/** Representative sandbox data — clearly test-only, generated on authorize. */
function seed(connection: UserBankConnection): Stored {
  const now = Date.now();
  const cur = "INR";

  if (connection.kind === "brokerage") {
    const holdings: Holding[] = [
      { id: id(), connectionId: connection.id, symbol: "RELIANCE", name: "Reliance Industries", quantity: 12, avgCost: 2380, lastPrice: 2915, currency: cur },
      { id: id(), connectionId: connection.id, symbol: "INFY", name: "Infosys", quantity: 20, avgCost: 1420, lastPrice: 1560, currency: cur },
      { id: id(), connectionId: connection.id, symbol: "TCS", name: "Tata Consultancy", quantity: 6, avgCost: 3650, lastPrice: 3480, currency: cur },
      { id: id(), connectionId: connection.id, symbol: "NIFTYBEES", name: "Nippon Nifty ETF", quantity: 40, avgCost: 235, lastPrice: 281, currency: cur },
    ];
    return { connection, accounts: [], balances: [], transactions: [], holdings };
  }

  const a1: BankAccount = { id: id(), connectionId: connection.id, name: `${connection.institutionName} Current`, kind: "current", currency: cur, maskedNumber: "•••• 4821" };
  const a2: BankAccount = { id: id(), connectionId: connection.id, name: `${connection.institutionName} Savings`, kind: "savings", currency: cur, maskedNumber: "•••• 9037" };
  const balances: AccountBalance[] = [
    { accountId: a1.id, current: 48210, available: 47010, currency: cur, asOf: now },
    { accountId: a2.id, current: 132400, available: 132400, currency: cur, asOf: now },
  ];
  const tx: BankTransaction[] = [
    { id: id(), accountId: a1.id, providerTxId: "sbx-1", amount: -1240, currency: cur, description: "Coffee House (sandbox)", category: "food", bookedAt: now - 1 * DAY },
    { id: id(), accountId: a1.id, providerTxId: "sbx-2", amount: -3690, currency: cur, description: "SuperMart (sandbox)", category: "groceries", bookedAt: now - 2 * DAY },
    { id: id(), accountId: a1.id, providerTxId: "sbx-3", amount: 95000, currency: cur, description: "Salary (sandbox)", category: "salary", bookedAt: now - 4 * DAY },
  ];
  return { connection, accounts: [a1, a2], balances, transactions: tx, holdings: [] };
}

export const sandboxProvider: BankConnectionProvider = {
  id: "sandbox",
  label: "Sandbox",
  live: false,

  async listInstitutions(region: string, kind: ConnectionKind): Promise<ProviderInstitution[]> {
    if (kind === "brokerage") return brokersForRegion(region);
    return institutionsForRegion(region).map((i) => ({ id: i.id, name: i.name, region: i.regions?.[0] ?? region, short: i.short, color: i.color }));
  },

  async createConnection({ institutionId, region, kind, scopes }): Promise<ConnectionInit> {
    void scopes;
    const list = kind === "brokerage" ? brokersForRegion(region) : institutionsForRegion(region).map((i) => ({ id: i.id, name: i.name, region, short: i.short, color: i.color }));
    const inst = list.find((i) => i.id === institutionId) ?? list[0]!;
    const connId = id();
    const consentId = id();
    const now = Date.now();
    upsert({
      connection: {
        id: connId,
        kind,
        provider: "sandbox",
        sandbox: true,
        institutionId: inst.id,
        institutionName: inst.name,
        region,
        status: "pending",
        consentId,
        createdAt: now,
        lastSyncedAt: null,
        updatedAt: now,
      },
      accounts: [],
      balances: [],
      transactions: [],
      holdings: [],
    });
    // In sandbox there is no external page — the UI's "Approve" step calls
    // handleCallback directly. We return a sentinel URL.
    return { connectionId: connId, consentId, authorizationUrl: "sandbox:approve", sandbox: true };
  },

  async handleCallback({ connectionId }): Promise<UserBankConnection> {
    const row = find(connectionId);
    if (!row) throw new Error("connection not found");
    const now = Date.now();
    const active: UserBankConnection = { ...row.connection, status: "active", lastSyncedAt: now, updatedAt: now };
    upsert({ ...seed(active) });
    return active;
  },

  async getAccounts(connectionId: string): Promise<BankAccount[]> {
    return find(connectionId)?.accounts ?? [];
  },
  async getBalances(connectionId: string): Promise<AccountBalance[]> {
    return find(connectionId)?.balances ?? [];
  },
  async getTransactions(connectionId: string): Promise<BankTransaction[]> {
    return find(connectionId)?.transactions ?? [];
  },
  async getHoldings(connectionId: string): Promise<Holding[]> {
    return find(connectionId)?.holdings ?? [];
  },

  async refreshConnection(connectionId: string): Promise<UserBankConnection> {
    const row = find(connectionId);
    if (!row) throw new Error("connection not found");
    const now = Date.now();
    const updated = { ...row.connection, lastSyncedAt: now, updatedAt: now };
    upsert({ ...row, connection: updated });
    return updated;
  },

  async disconnect(connectionId: string): Promise<void> {
    writeAll(readAll().filter((r) => r.connection.id !== connectionId));
  },
};
