"use client";

import { addDoc, deleteDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { userCollection, userDoc } from "@/lib/firestore/db";
import { getActiveWorkspace } from "@/lib/workspace";
import type { Reminder, Category, Priority, RepeatRule } from "@/lib/types";

export interface ReminderInput {
  title: string;
  dueAt: number;
  hasTime: boolean;
  notes?: string;
  category?: Category;
  priority?: Priority;
  repeat?: RepeatRule;
}

export async function createReminder(uid: string, input: ReminderInput): Promise<string> {
  const ref = await addDoc(userCollection(uid, "reminders"), {
    scope: getActiveWorkspace(),
    title: input.title,
    dueAt: input.dueAt,
    hasTime: input.hasTime,
    notes: input.notes ?? "",
    category: input.category ?? "other",
    priority: input.priority ?? "normal",
    repeat: input.repeat ?? "none",
    completed: false,
    completedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateReminder(uid: string, id: string, patch: Partial<Reminder>): Promise<void> {
  await updateDoc(userDoc(uid, "reminders", id), { ...patch, updatedAt: serverTimestamp() });
}

/** Toggle a reminder done/undone, stamping completedAt. */
export async function setReminderDone(uid: string, id: string, done: boolean): Promise<void> {
  await updateDoc(userDoc(uid, "reminders", id), {
    completed: done,
    completedAt: done ? Date.now() : null,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteReminder(uid: string, id: string): Promise<void> {
  await deleteDoc(userDoc(uid, "reminders", id));
}

/** Re-create a just-deleted reminder (Undo). */
export async function restoreReminder(uid: string, reminder: Reminder): Promise<void> {
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = reminder;
  await addDoc(userCollection(uid, "reminders"), { ...rest, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}
