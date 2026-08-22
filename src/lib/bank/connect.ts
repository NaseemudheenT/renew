"use client";

import { addDoc, serverTimestamp } from "firebase/firestore";
import { userCollection } from "@/lib/firestore/db";
import type { Institution } from "./banks";
import type { Account } from "@/lib/types";

export interface ConnectResult {
  accountName: string;
}

/**
 * Add a bank / UPI / wallet to Renew as a real account the person owns. No data
 * is fabricated — the account starts empty, and its balance grows only from real
 * activity the person records (tap, scan, voice) or a real bank feed once that is
 * connected. Renew only ever tracks real money.
 */
export async function connectInstitution(
  uid: string,
  opts: { institution: Institution; currency: string },
): Promise<ConnectResult> {
  const { institution, currency } = opts;
  const cashLike = institution.kind === "upi" || institution.kind === "wallet";
  const name = cashLike ? institution.name : `${institution.name} Account`;

  await addDoc(userCollection(uid, "accounts"), {
    name,
    atype: cashLike ? "other" : "bank",
    institution: institution.name,
    currency,
    openingBalance: 0,
    status: "active",
    linked: true,
    lastSyncedAt: Date.now(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { accountName: name };
}

/** Whether any active account is a linked bank/UPI/wallet connection. */
export function hasLinkedAccount(accounts: Account[]): boolean {
  return accounts.some((a) => a.linked && a.status === "active");
}
