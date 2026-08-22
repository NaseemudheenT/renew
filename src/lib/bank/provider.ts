/**
 * The seam between Renew and whatever supplies bank data. Everything in the app
 * talks to a BankProvider; today that's the realistic simulated feed, and when a
 * licensed Account-Aggregator (India) or open-banking / Plaid (global) account is
 * available, a live provider implements the SAME interface and is selected here —
 * no UI or data-model change required.
 */

import { buildSyncPlan, type SyncPlan } from "./simulate";
import type { Institution } from "./banks";

export interface FetchOpts {
  institution: Institution;
  currency: string;
  now?: number;
}

export interface BankProvider {
  id: string;
  label: string;
  /** true once this returns a real, live bank feed (vs. the preview sync). */
  live: boolean;
  fetchSync(opts: FetchOpts): SyncPlan | Promise<SyncPlan>;
}

/** Pre-licence default: a believable, deterministic history (see ./simulate). */
export const simulatedProvider: BankProvider = {
  id: "renew-preview",
  label: "Renew preview sync",
  live: false,
  fetchSync: (opts) => buildSyncPlan(opts),
};

/**
 * The provider Renew currently uses. When a live provider is added, switch here
 * (e.g. read an env flag / user's region and return the aggregator provider).
 */
export function activeProvider(): BankProvider {
  return simulatedProvider;
}
