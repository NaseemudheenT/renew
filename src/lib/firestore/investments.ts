"use client";

import { addDoc, deleteDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { userCollection, userDoc } from "@/lib/firestore/db";
import { getActiveWorkspace } from "@/lib/workspace";
import type { InvestmentType } from "@/lib/types";

export interface InvestmentInput {
  name: string;
  itype: InvestmentType;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  currency: string;
}

export async function createInvestment(uid: string, input: InvestmentInput): Promise<string> {
  const ref = await addDoc(userCollection(uid, "investments"), {
    scope: getActiveWorkspace(),
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}
export async function updateInvestment(uid: string, id: string, patch: Partial<InvestmentInput>): Promise<void> {
  await updateDoc(userDoc(uid, "investments", id), { ...patch, updatedAt: serverTimestamp() });
}
export async function deleteInvestment(uid: string, id: string): Promise<void> {
  await deleteDoc(userDoc(uid, "investments", id));
}
