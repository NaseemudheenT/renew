"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client";

interface AuthState {
  user: User | null;
  loading: boolean;
  configured: boolean;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  configured: false,
});

/**
 * Client auth state (identity for the UI). The real authorization boundary is
 * the server session cookie verified in protected layouts — this just powers
 * things like the account menu and avatar.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  // When Firebase isn't configured there's nothing to wait for, so start ready.
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) return; // loading already false via initial state
    const unsub = onAuthStateChanged(getFirebaseAuth(), (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, [configured]);

  return (
    <AuthContext.Provider value={{ user, loading, configured }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
