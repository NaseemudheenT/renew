"use client";

import { doc, writeBatch, serverTimestamp } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { userCollection } from "@/lib/firestore/db";
import { activeProvider } from "./provider";
import type { Institution } from "./banks";
import type { Account } from "@/lib/types";

export interface ConnectResult {
  live: boolean;
  accounts: number;
  transactions: number;
  bills: number;
  subscriptions: number;
}

/**
 * Connect an institution and pull its history into the user's own data, in one
 * atomic batch, under users/{uid}/*. The written accounts are flagged `linked`
 * so the app knows the money is auto-synced. Uses the active provider (a preview
 * feed today) — swapping in a live provider changes nothing here.
 */
export async function connectInstitution(
  uid: string,
  opts: { institution: Institution; currency: string; now?: number },
): Promise<ConnectResult> {
  const provider = activeProvider();
  const plan = await provider.fetchSync(opts);
  const db = getDb();
  const batch = writeBatch(db);
  const now = opts.now ?? Date.now();

  // Create account refs up front so transactions can reference their ids.
  const keyToId = new Map<string, string>();
  for (const a of plan.accounts) {
    const ref = doc(userCollection(uid, "accounts"));
    keyToId.set(a.key, ref.id);
    batch.set(ref, {
      name: a.name,
      atype: a.atype,
      institution: a.institution,
      currency: a.currency,
      openingBalance: a.openingBalance,
      status: "active",
      linked: true,
      lastSyncedAt: now,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  for (const t of plan.transactions) {
    const ref = doc(userCollection(uid, "transactions"));
    batch.set(ref, {
      type: t.type,
      amount: t.amount,
      currency: t.currency,
      category: t.category,
      note: t.note,
      date: t.date,
      accountId: keyToId.get(t.accountKey) ?? "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  for (const b of plan.bills) {
    const ref = doc(userCollection(uid, "payments"));
    batch.set(ref, {
      name: b.name,
      amount: b.amount,
      currency: b.currency,
      dueAt: b.dueAt,
      status: "upcoming",
      category: b.category,
      repeat: b.repeat,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  for (const s of plan.subscriptions) {
    const ref = doc(userCollection(uid, "subscriptions"));
    batch.set(ref, {
      name: s.name,
      price: s.price,
      currency: s.currency,
      cycle: s.cycle,
      nextBillingAt: s.nextBillingAt,
      category: s.category,
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
  return { live: provider.live, ...plan.summary };
}

/** Whether any active account is a linked (auto-synced) bank/UPI connection. */
export function hasLinkedAccount(accounts: Account[]): boolean {
  return accounts.some((a) => a.linked && a.status === "active");
}
