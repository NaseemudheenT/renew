"use client";

import { addDoc, deleteDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { userCollection, userDoc } from "@/lib/firestore/db";
import type { Transaction, TxType } from "@/lib/types";

export interface TransactionInput {
  type: TxType;
  amount: number;
  currency: string;
  category: string;
  note?: string;
  date: number;
}

export async function createTransaction(uid: string, input: TransactionInput): Promise<string> {
  const ref = await addDoc(userCollection(uid, "transactions"), {
    ...input,
    note: input.note ?? "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
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
