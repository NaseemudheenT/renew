"use client";

import {
  collection,
  doc,
  Timestamp,
  type CollectionReference,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";

/**
 * All user data lives under users/{uid}/{collection}, so ownership is implicit
 * in the path and enforced by a single Firestore rule. These helpers build the
 * refs and normalise Firestore Timestamps to epoch millis at the boundary so
 * the rest of the app only ever deals with plain numbers.
 */

export type CollectionName =
  | "reminders"
  | "tasks"
  | "documents"
  | "payments"
  | "notifications"
  | "transactions"
  | "budgets"
  | "savings"
  | "investments";

export function userCollection(
  uid: string,
  name: CollectionName,
): CollectionReference<DocumentData> {
  return collection(getDb(), "users", uid, name);
}

export function userDoc(uid: string, name: CollectionName, id: string) {
  return doc(getDb(), "users", uid, name, id);
}

/** Convert any Firestore Timestamp fields on a plain object to millis. */
function normalizeTimestamps(data: DocumentData): DocumentData {
  const out: DocumentData = {};
  for (const [key, value] of Object.entries(data)) {
    out[key] = value instanceof Timestamp ? value.toMillis() : value;
  }
  return out;
}

/** Map a Firestore snapshot to a typed domain object with `id`. */
export function fromSnapshot<T>(snap: QueryDocumentSnapshot<DocumentData>): T {
  return { id: snap.id, ...normalizeTimestamps(snap.data()) } as T;
}
