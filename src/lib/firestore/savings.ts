"use client";

import { addDoc, deleteDoc, updateDoc, serverTimestamp, increment } from "firebase/firestore";
import { userCollection, userDoc } from "@/lib/firestore/db";

export interface SavingsInput {
  name: string;
  target: number;
  current: number;
  currency: string;
  targetDate?: number | null;
}

export async function createSavings(uid: string, input: SavingsInput): Promise<string> {
  const ref = await addDoc(userCollection(uid, "savings"), {
    ...input,
    targetDate: input.targetDate ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}
export async function updateSavings(uid: string, id: string, patch: Partial<SavingsInput>): Promise<void> {
  await updateDoc(userDoc(uid, "savings", id), { ...patch, updatedAt: serverTimestamp() });
}
export async function addToSavings(uid: string, id: string, delta: number): Promise<void> {
  await updateDoc(userDoc(uid, "savings", id), { current: increment(delta), updatedAt: serverTimestamp() });
}
export async function deleteSavings(uid: string, id: string): Promise<void> {
  await deleteDoc(userDoc(uid, "savings", id));
}
