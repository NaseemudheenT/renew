"use client";

import { addDoc, deleteDoc, updateDoc, serverTimestamp, writeBatch, doc } from "firebase/firestore";
import { userCollection, userDoc } from "@/lib/firestore/db";
import { getDb } from "@/lib/firebase/client";
import { getActiveWorkspace } from "@/lib/workspace";
import type { Transaction, TxType } from "@/lib/types";

export interface TransactionInput {
  type: TxType;
  amount: number;
  currency: string;
  category: string;
  note?: string;
  date: number;
  /** Optional account this transaction belongs to. */
  accountId?: string;
}

export async function createTransaction(uid: string, input: TransactionInput): Promise<string> {
  const ref = await addDoc(userCollection(uid, "transactions"), {
    ...input,
    note: input.note ?? "",
    accountId: input.accountId ?? "",
    scope: getActiveWorkspace(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Bulk-create transactions (CSV import). Chunked to Firestore's 500/batch limit. */
export async function importTransactions(uid: string, inputs: TransactionInput[]): Promise<number> {
  const db = getDb();
  const col = userCollection(uid, "transactions");
  let written = 0;
  for (let i = 0; i < inputs.length; i += 400) {
    const batch = writeBatch(db);
    for (const input of inputs.slice(i, i + 400)) {
      batch.set(doc(col), {
        ...input,
        note: input.note ?? "",
        accountId: input.accountId ?? "",
        scope: getActiveWorkspace(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
    written += Math.min(400, inputs.length - i);
  }
  return written;
}

export async function updateTransaction(uid: string, id: string, patch: Partial<TransactionInput>): Promise<void> {
  await updateDoc(userDoc(uid, "transactions", id), { ...patch, updatedAt: serverTimestamp() });
}

export async function deleteTransaction(uid: string, id: string): Promise<void> {
  await deleteDoc(userDoc(uid, "transactions", id));
}

export async function restoreTransaction(uid: string, tx: Transaction): Promise<void> {
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = tx;
  await addDoc(userCollection(uid, "transactions"), { ...rest, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}
