"use client";

import {
  addDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { userCollection, userDoc } from "@/lib/firestore/db";
import { nextOccurrence } from "@/lib/dates";
import type { Reminder, Category, Priority, RepeatRule } from "@/lib/types";

export interface ReminderInput {
  title: string;
  notes?: string;
  dueAt: number;
  hasTime: boolean;
  repeat: RepeatRule;
  category: Category;
  priority: Priority;
}

export async function createReminder(
  uid: string,
  input: ReminderInput,
): Promise<string> {
  const ref = await addDoc(userCollection(uid, "reminders"), {
    ...input,
    notes: input.notes ?? "",
    completed: false,
    completedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateReminder(
  uid: string,
  id: string,
  patch: Partial<ReminderInput>,
): Promise<void> {
  await updateDoc(userDoc(uid, "reminders", id), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteReminder(uid: string, id: string): Promise<void> {
  await deleteDoc(userDoc(uid, "reminders", id));
}

/**
 * Complete a reminder. A repeating reminder "renews" — it advances to its next
 * occurrence and stays active, which is the heart of the product. A one-off is
 * marked completed (and can be restored).
 */
export async function completeReminder(
  uid: string,
  reminder: Reminder,
): Promise<{ renewed: boolean; nextDue?: number }> {
  if (reminder.repeat !== "none") {
    const nextDue = nextOccurrence(reminder.dueAt, reminder.repeat);
    await updateDoc(userDoc(uid, "reminders", reminder.id), {
      dueAt: nextDue,
      completed: false,
      completedAt: null,
      updatedAt: serverTimestamp(),
    });
    return { renewed: true, nextDue };
  }
  await updateDoc(userDoc(uid, "reminders", reminder.id), {
    completed: true,
    completedAt: Date.now(),
    updatedAt: serverTimestamp(),
  });
  return { renewed: false };
}

/** Re-open a completed reminder. */
export async function reopenReminder(uid: string, id: string): Promise<void> {
  await updateDoc(userDoc(uid, "reminders", id), {
    completed: false,
    completedAt: null,
    updatedAt: serverTimestamp(),
  });
}

/** Recreate a reminder from a snapshot (used for undo-delete). */
export async function restoreReminder(
  uid: string,
  reminder: Reminder,
): Promise<void> {
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = reminder;
  await addDoc(userCollection(uid, "reminders"), {
    ...rest,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
