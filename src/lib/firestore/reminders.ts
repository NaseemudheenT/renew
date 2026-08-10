import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import type { NewReminder, Reminder } from "./types";

function remindersCol(uid: string) {
  return collection(getDb(), "users", uid, "reminders");
}

/** Live subscription to a user's reminders, sorted by due date. */
export function subscribeReminders(uid: string, cb: (reminders: Reminder[]) => void) {
  const q = query(remindersCol(uid), orderBy("dueDate", "asc"));
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Reminder, "id">) }))),
    (err) => {
      // Firestore not reachable / rules deny / DB not enabled: don't hang the
      // UI on skeletons — surface the empty state instead.
      console.error("[reminders] subscription error:", err.code || err.message);
      cb([]);
    },
  );
}

export async function addReminder(uid: string, data: NewReminder): Promise<string> {
  const now = Date.now();
  const ref = await addDoc(remindersCol(uid), {
    ...data,
    recurring: data.recurring ?? null,
    completed: false,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateReminder(uid: string, id: string, patch: Partial<Reminder>) {
  await updateDoc(doc(getDb(), "users", uid, "reminders", id), {
    ...patch,
    updatedAt: Date.now(),
  });
}

export async function deleteReminder(uid: string, id: string) {
  await deleteDoc(doc(getDb(), "users", uid, "reminders", id));
}
