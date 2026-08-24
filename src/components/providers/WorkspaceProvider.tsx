"use client";

import { createContext, useCallback, useContext, useSyncExternalStore, type ReactNode } from "react";
import type { WorkspaceMode } from "@/lib/types";
import { WORKSPACE_EVENT, getActiveWorkspace, setActiveWorkspace } from "@/lib/workspace";

interface WorkspaceCtx {
  mode: WorkspaceMode;
  setMode: (m: WorkspaceMode) => void;
}

const WorkspaceContext = createContext<WorkspaceCtx>({ mode: "personal", setMode: () => {} });

export function useWorkspace(): WorkspaceCtx {
  return useContext(WorkspaceContext);
}

/** Provides the active Personal/Business workspace, in sync with the write-time scope. */
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const mode = useSyncExternalStore(
    (cb) => {
      window.addEventListener(WORKSPACE_EVENT, cb);
      window.addEventListener("storage", cb);
      return () => {
        window.removeEventListener(WORKSPACE_EVENT, cb);
        window.removeEventListener("storage", cb);
      };
    },
    getActiveWorkspace,
    () => "personal" as WorkspaceMode,
  );

  const setMode = useCallback((m: WorkspaceMode) => setActiveWorkspace(m), []);

  return <WorkspaceContext.Provider value={{ mode, setMode }}>{children}</WorkspaceContext.Provider>;
}
