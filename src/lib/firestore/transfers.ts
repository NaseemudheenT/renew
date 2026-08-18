"use client";

import { addDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { userCollection, userDoc } from "@/lib/firestore/db";

export interface TransferInput {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  /** Both accounts must share this currency (validated at the boundary). */
  currency: string;
  date: number;
  note?: string;
}

export class TransferError extends Error {}

/** Validate a transfer. Throws TransferError on invalid input. */
export function validateTransfer(input: TransferInput): void {
  if (!input.fromAccountId || !input.toAccountId) {
    throw new TransferError("Choose both accounts.");
  }
  if (input.fromAccountId === input.toAccountId) {
    throw new TransferError("Choose two different accounts.");
  }
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new TransferError("Enter a valid amount.");
  }
}

export async function createTransfer(uid: string, input: TransferInput): Promise<string> {
  validateTransfer(input);
  const ref = await addDoc(userCollection(uid, "transfers"), {
    fromAccountId: input.fromAccountId,
    toAccountId: input.toAccountId,
    amount: input.amount,
    currency: input.currency,
    date: input.date,
    note: input.note ?? "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteTransfer(uid: string, id: string): Promise<void> {
  await deleteDoc(userDoc(uid, "transfers", id));
}
