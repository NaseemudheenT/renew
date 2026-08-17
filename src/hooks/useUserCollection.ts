"use client";

import { useEffect, useMemo, useState } from "react";
import {
  onSnapshot,
  query,
  type QueryConstraint,
} from "firebase/firestore";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  userCollection,
  fromSnapshot,
  type CollectionName,
} from "@/lib/firestore/db";

export interface CollectionState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  /** The signed-in uid, or null while resolving. */
  uid: string | null;
}

const EMPTY: never[] = [];

/**
 * Realtime subscription to users/{uid}/{name} with optional query constraints.
 * Re-subscribes when the constraints change. Returns typed, timestamp-normalised
 * docs. Empty result with loading:false is a genuine empty state (not an error).
 *
 * State is only ever written from the snapshot callbacks (never synchronously in
 * the effect), and the signed-out case is derived — this keeps React 19 happy
 * and avoids cascading renders.
 *
 * Pass a STABLE `constraints` array (memoise at the call site) to avoid churn.
 */
export function useUserCollection<T>(
  name: CollectionName,
  constraints: QueryConstraint[] = EMPTY,
): CollectionState<T> {
  const { user, loading: authLoading } = useAuth();
  const uid = user?.uid ?? null;
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const deps = useMemo(() => constraints, [constraints]);

  useEffect(() => {
    if (authLoading || !uid) return;
    const q = query(userCollection(uid, name), ...deps);
    const unsub = onSnapshot(
      q,
      (snap) => {
        setData(snap.docs.map((d) => fromSnapshot<T>(d)));
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [uid, authLoading, name, deps]);

  // Derive the signed-out / resolving case without synchronous setState.
  if (!uid) {
    return { data: EMPTY as T[], loading: authLoading, error: null, uid: null };
  }
  return { data, loading, error, uid };
}
