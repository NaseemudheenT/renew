"use client";

import { addDoc, deleteDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { userCollection, userDoc } from "@/lib/firestore/db";
import { getActiveWorkspace } from "@/lib/workspace";

export interface BudgetInput {
  category: string;
  amount: number;
  currency: string;
}

export async function createBudget(uid: string, input: BudgetInput): Promise<string> {
  const ref = await addDoc(userCollection(uid, "budgets"), {
    scope: getActiveWorkspace(),
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}
export async function updateBudget(uid: string, id: string, patch: Partial<BudgetInput>): Promise<void> {
  await updateDoc(userDoc(uid, "budgets", id), { ...patch, updatedAt: serverTimestamp() });
}
export async function deleteBudget(uid: string, id: string): Promise<void> {
  await deleteDoc(userDoc(uid, "budgets", id));
}

/** Re-create a just-deleted budget (Undo). */
export async function restoreBudget(uid: string, budget: import("@/lib/types").Budget): Promise<void> {
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = budget;
  await addDoc(userCollection(uid, "budgets"), { ...rest, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}
