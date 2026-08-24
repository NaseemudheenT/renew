"use client";

import {
  addDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { userCollection, userDoc } from "@/lib/firestore/db";
import { getActiveWorkspace } from "@/lib/workspace";
import { nextOccurrence } from "@/lib/dates";
import type { Payment, Category, RepeatRule } from "@/lib/types";

export interface PaymentInput {
  name: string;
  amount: number;
  currency: string;
  dueAt: number;
  category: Category;
  repeat: RepeatRule;
  notes?: string;
}

export async function createPayment(
  uid: string,
  input: PaymentInput,
): Promise<string> {
  const ref = await addDoc(userCollection(uid, "payments"), {
    scope: getActiveWorkspace(),
    ...input,
    notes: input.notes ?? "",
    status: "upcoming",
    paidAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updatePayment(
  uid: string,
  id: string,
  patch: Partial<PaymentInput>,
): Promise<void> {
  await updateDoc(userDoc(uid, "payments", id), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePayment(uid: string, id: string): Promise<void> {
  await deleteDoc(userDoc(uid, "payments", id));
}

/**
 * Mark a payment paid. A recurring payment rolls forward to its next due date
 * and stays "upcoming" (records the last paid time); a one-off becomes "paid".
 */
export async function markPaid(
  uid: string,
  payment: Payment,
): Promise<{ rolled: boolean; nextDue?: number }> {
  if (payment.repeat !== "none") {
    const nextDue = nextOccurrence(payment.dueAt, payment.repeat);
    await updateDoc(userDoc(uid, "payments", payment.id), {
      dueAt: nextDue,
      status: "upcoming",
      paidAt: Date.now(),
      updatedAt: serverTimestamp(),
    });
    return { rolled: true, nextDue };
  }
  await updateDoc(userDoc(uid, "payments", payment.id), {
    status: "paid",
    paidAt: Date.now(),
    updatedAt: serverTimestamp(),
  });
  return { rolled: false };
}

export async function markUnpaid(uid: string, id: string): Promise<void> {
  await updateDoc(userDoc(uid, "payments", id), {
    status: "upcoming",
    paidAt: null,
    updatedAt: serverTimestamp(),
  });
}

export async function restorePayment(uid: string, payment: Payment): Promise<void> {
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = payment;
  await addDoc(userCollection(uid, "payments"), {
    ...rest,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
