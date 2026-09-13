"use client";

import { useSyncExternalStore } from "react";

/**
 * A tiny store for whether the desktop sidebar is collapsed (hidden). Shared by
 * the Sidebar and the TopBar toggle so "hide the menu / bring it back" stays in
 * sync, and remembered across visits via localStorage.
 */
const KEY = "renew-sidebar-collapsed";
const subs = new Set<() => void>();
let collapsed = false;
let ready = false;

function ensure() {
  if (ready) return;
  ready = true;
  try { collapsed = localStorage.getItem(KEY) === "1"; } catch { /* default false */ }
}

export function toggleSidebar(): void {
  ensure();
  collapsed = !collapsed;
  try { localStorage.setItem(KEY, collapsed ? "1" : "0"); } catch { /* ignore */ }
  subs.forEach((f) => f());
}

function subscribe(cb: () => void): () => void {
  subs.add(cb);
  return () => subs.delete(cb);
}
function getSnapshot(): boolean {
  ensure();
  return collapsed;
}

export function useSidebarCollapsed(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
