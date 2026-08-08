"use client";

/**
 * Auth context — subscribes to Firebase auth state once and exposes the current
 * user plus common actions. `initializing` is true until the first auth state
 * resolves, so guards never flash the wrong UI.
 */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";

interface AuthContextValue {
  user: User | null;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let unsub = () => {};
    try {
      // getFirebaseAuth() is called here (client, post-mount) — never during
      // render/SSR — so a missing Firebase config can't break prerendering.
      unsub = onAuthStateChanged(getFirebaseAuth(), (u) => {
        setUser(u);
        setInitializing(false);
      });
    } catch (err) {
      // Firebase not configured for this deployment — degrade gracefully.
      console.error("[auth] Firebase is not configured:", err);
    }
    return () => unsub();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      signIn: async (email, password) =>
        (await signInWithEmailAndPassword(getFirebaseAuth(), email, password)).user,
      signUp: async (email, password) =>
        (await createUserWithEmailAndPassword(getFirebaseAuth(), email, password)).user,
      logout: () => signOut(getFirebaseAuth()),
    }),
    [user, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
