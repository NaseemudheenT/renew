"use client";

import { create } from "zustand";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "error";
  action?: ToastAction;
  duration: number;
}

interface ToastStore {
  toasts: Toast[];
  push: (t: Omit<Toast, "id" | "duration"> & { duration?: number }) => string;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (t) => {
    const id = Math.random().toString(36).slice(2);
    const duration = t.duration ?? (t.action ? 6000 : 4000);
    set((s) => ({ toasts: [...s.toasts, { ...t, id, duration }] }));
    return id;
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

/** Imperative helper: `toast({ title: "Saved" })`. */
export function toast(t: Omit<Toast, "id" | "duration"> & { duration?: number }) {
  return useToastStore.getState().push(t);
}
