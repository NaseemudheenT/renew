"use client";

import {
  writeBatch,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { userCollection, userDoc } from "@/lib/firestore/db";

export async function markNotificationRead(uid: string, id: string) {
  await updateDoc(userDoc(uid, "notifications", id), { read: true });
}

export async function markAllNotificationsRead(uid: string) {
  const snap = await getDocs(
    query(userCollection(uid, "notifications"), where("read", "==", false)),
  );
  if (snap.empty) return;
  const batch = writeBatch(getDb());
  snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
  await batch.commit();
}

export async function deleteNotification(uid: string, id: string) {
  await deleteDoc(userDoc(uid, "notifications", id));
}
