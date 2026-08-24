"use client";

import { addDoc, deleteDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { userCollection, userDoc } from "@/lib/firestore/db";
import { getActiveWorkspace } from "@/lib/workspace";
import type { BillingCycle, SubscriptionStatus } from "@/lib/types";

export interface SubscriptionInput {
  name: string;
  price: number;
  currency: string;
  cycle: BillingCycle;
  nextBillingAt: number;
  category: string;
  accountId?: string;
  notes?: string;
}

export async function createSubscription(uid: string, input: SubscriptionInput): Promise<string> {
  const ref = await addDoc(userCollection(uid, "subscriptions"), {
    scope: getActiveWorkspace(),
    ...input,
    accountId: input.accountId ?? "",
    notes: input.notes ?? "",
    status: "active" as SubscriptionStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateSubscription(uid: string, id: string, patch: Partial<SubscriptionInput>): Promise<void> {
  await updateDoc(userDoc(uid, "subscriptions", id), { ...patch, updatedAt: serverTimestamp() });
}

export async function setSubscriptionStatus(uid: string, id: string, status: SubscriptionStatus): Promise<void> {
  await updateDoc(userDoc(uid, "subscriptions", id), { status, updatedAt: serverTimestamp() });
}

export async function deleteSubscription(uid: string, id: string): Promise<void> {
  await deleteDoc(userDoc(uid, "subscriptions", id));
}
