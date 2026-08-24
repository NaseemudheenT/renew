"use client";

import type { WorkspaceMode } from "@/lib/types";

/**
 * Renew runs as two separate workspaces — Personal and Business — that the person
 * switches between. Every financial record is stamped with the active workspace
 * at write time (see the create* functions), and each view only shows the active
 * workspace's data. This module holds the current workspace so writes can stamp
 * it without threading it through every call site; the WorkspaceProvider keeps it
 * in sync with the UI. Records saved before workspaces existed have no scope and
 * are treated as Personal.
 */

export const WORKSPACE_KEY = "renew-workspace";
export const WORKSPACE_EVENT = "renew-workspace-change";

let active: WorkspaceMode = "personal";

export function readStoredWorkspace(): WorkspaceMode {
  if (typeof window === "undefined") return "personal";
  try {
    return localStorage.getItem(WORKSPACE_KEY) === "business" ? "business" : "personal";
  } catch {
    return "personal";
  }
}

// Initialise from storage on first import (client only).
if (typeof window !== "undefined") active = readStoredWorkspace();

export function getActiveWorkspace(): WorkspaceMode {
  return active;
}

export function setActiveWorkspace(mode: WorkspaceMode): void {
  active = mode;
  try {
    localStorage.setItem(WORKSPACE_KEY, mode);
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(WORKSPACE_EVENT));
}

/** True if a record with this scope belongs in the given workspace (legacy = personal). */
export function inWorkspace(scope: WorkspaceMode | undefined, mode: WorkspaceMode): boolean {
  return (scope ?? "personal") === mode;
}
