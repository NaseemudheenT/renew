"use client";

import {
  addDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { userCollection, userDoc } from "@/lib/firestore/db";
import type { Task, Priority } from "@/lib/types";

export interface TaskInput {
  title: string;
  notes?: string;
  dueAt?: number | null;
  priority: Priority;
}

export async function createTask(uid: string, input: TaskInput): Promise<string> {
  const ref = await addDoc(userCollection(uid, "tasks"), {
    title: input.title,
    notes: input.notes ?? "",
    dueAt: input.dueAt ?? null,
    priority: input.priority,
    completed: false,
    completedAt: null,
    order: Date.now(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateTask(
  uid: string,
  id: string,
  patch: Partial<TaskInput>,
): Promise<void> {
  await updateDoc(userDoc(uid, "tasks", id), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTask(uid: string, id: string): Promise<void> {
  await deleteDoc(userDoc(uid, "tasks", id));
}

export async function setTaskCompleted(
  uid: string,
  id: string,
  completed: boolean,
): Promise<void> {
  await updateDoc(userDoc(uid, "tasks", id), {
    completed,
    completedAt: completed ? Date.now() : null,
    updatedAt: serverTimestamp(),
  });
}

/** Recreate a task from a snapshot (undo-delete). */
export async function restoreTask(uid: string, task: Task): Promise<void> {
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = task;
  await addDoc(userCollection(uid, "tasks"), {
    ...rest,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
