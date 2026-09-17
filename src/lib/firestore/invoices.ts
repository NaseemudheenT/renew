"use client";

import {
  addDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { userCollection, userDoc } from "@/lib/firestore/db";
import { getActiveWorkspace } from "@/lib/workspace";
import type { Invoice } from "@/lib/types";

/**
 * Invoices — the first piece of Renew's Business/Freelancer tier. Freelancers
 * and small businesses log the invoices they send to clients and track which
 * are paid, unpaid or overdue. Renew never moves money; this is record-keeping.
 *
 * Every invoice is stamped with the active workspace (Business), so it only ever
 * shows in the Business workspace and never mixes with personal data.
 */
export interface InvoiceInput {
  number: string;
  client: string;
  clientId?: string;
  amount: number;
  currency: string;
  issuedAt: number;
  dueAt: number;
  notes?: string;
}

export async function createInvoice(uid: string, input: InvoiceInput): Promise<string> {
  const ref = await addDoc(userCollection(uid, "invoices"), {
    scope: getActiveWorkspace(),
    ...input,
    clientId: input.clientId ?? "",
    notes: input.notes ?? "",
    status: "unpaid",
    paidAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateInvoice(
  uid: string,
  id: string,
  patch: Partial<InvoiceInput>,
): Promise<void> {
  await updateDoc(userDoc(uid, "invoices", id), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteInvoice(uid: string, id: string): Promise<void> {
  await deleteDoc(userDoc(uid, "invoices", id));
}

/** Mark an invoice paid or back to unpaid (records/clears the paid time). */
export async function setInvoicePaid(uid: string, id: string, paid: boolean): Promise<void> {
  await updateDoc(userDoc(uid, "invoices", id), {
    status: paid ? "paid" : "unpaid",
    paidAt: paid ? Date.now() : null,
    updatedAt: serverTimestamp(),
  });
}

/** Re-create a deleted invoice (for Undo), preserving its fields. */
export async function restoreInvoice(uid: string, invoice: Invoice): Promise<void> {
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = invoice;
  await addDoc(userCollection(uid, "invoices"), {
    ...rest,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
