"use client";

import { addDoc, deleteDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { userCollection, userDoc } from "@/lib/firestore/db";
import type { AccountType, AccountStatus } from "@/lib/types";

export interface AccountInput {
  name: string;
  atype: AccountType;
  institution?: string;
  currency: string;
  openingBalance: number;
}

export async function createAccount(uid: string, input: AccountInput): Promise<string> {
  const ref = await addDoc(userCollection(uid, "accounts"), {
    ...input,
    institution: input.institution ?? "",
    status: "active" as AccountStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateAccount(uid: string, id: string, patch: Partial<AccountInput>): Promise<void> {
  await updateDoc(userDoc(uid, "accounts", id), { ...patch, updatedAt: serverTimestamp() });
}

/** Archive or restore an account — its transaction history is preserved. */
export async function setAccountStatus(uid: string, id: string, status: AccountStatus): Promise<void> {
  await updateDoc(userDoc(uid, "accounts", id), { status, updatedAt: serverTimestamp() });
}

/**
 * Permanently delete an account. The UI gates this behind an explicit confirm
 * and prefers archiving; transactions/transfers referencing the id are left
 * intact (they resolve to an "unassigned" account rather than being destroyed).
 */
export async function deleteAccount(uid: string, id: string): Promise<void> {
  await deleteDoc(userDoc(uid, "accounts", id));
}
