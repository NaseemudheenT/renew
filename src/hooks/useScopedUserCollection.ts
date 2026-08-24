"use client";

import { useMemo } from "react";
import type { QueryConstraint } from "firebase/firestore";
import { useUserCollection, type CollectionState } from "@/hooks/useUserCollection";
import type { CollectionName } from "@/lib/firestore/db";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { inWorkspace } from "@/lib/workspace";
import type { WorkspaceMode } from "@/lib/types";

/**
 * Like useUserCollection, but returns only the records that belong to the active
 * Personal/Business workspace (records written before workspaces existed have no
 * scope and count as Personal). Use this for every financial collection so the
 * whole app switches cleanly between the two workspaces.
 */
export function useScopedUserCollection<T>(
  name: CollectionName,
  constraints?: QueryConstraint[],
): CollectionState<T> {
  const { mode } = useWorkspace();
  const raw = useUserCollection<T>(name, constraints);
  const data = useMemo(
    () => raw.data.filter((d) => inWorkspace((d as { scope?: WorkspaceMode }).scope, mode)),
    [raw.data, mode],
  );
  return { ...raw, data };
}
