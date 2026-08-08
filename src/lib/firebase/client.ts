"use client";

/**
 * Firebase client SDK — browser only, lazily initialised.
 *
 * Everything is created on first use via getters (never at module load), so
 * static prerendering / SSR never touches Firebase. This keeps the production
 * build resilient even when the NEXT_PUBLIC_FIREBASE_* env vars are absent
 * (the build succeeds; Firebase simply activates on the client where configured).
 * Singletons guard against duplicate apps across hot-reloads.
 */
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
  type Auth,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { clientEnv } from "@/lib/env";

const firebaseConfig = {
  apiKey: clientEnv.firebase.apiKey,
  authDomain: clientEnv.firebase.authDomain,
  projectId: clientEnv.firebase.projectId,
  storageBucket: clientEnv.firebase.storageBucket,
  messagingSenderId: clientEnv.firebase.messagingSenderId,
  appId: clientEnv.firebase.appId,
  measurementId: clientEnv.firebase.measurementId || undefined,
};

let app: FirebaseApp | null = null;
export function getFirebaseApp(): FirebaseApp {
  if (app) return app;
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return app;
}

let authInstance: Auth | null = null;
export function getFirebaseAuth(): Auth {
  if (authInstance) return authInstance;
  authInstance = getAuth(getFirebaseApp());
  // Keep the session across reloads/tabs; harmless if it fails (private mode).
  if (typeof window !== "undefined") {
    setPersistence(authInstance, browserLocalPersistence).catch(() => {});
  }
  return authInstance;
}

let dbInstance: Firestore | null = null;
export function getDb(): Firestore {
  return (dbInstance ??= getFirestore(getFirebaseApp()));
}

let storageInstance: FirebaseStorage | null = null;
export function getStorageClient(): FirebaseStorage {
  return (storageInstance ??= getStorage(getFirebaseApp()));
}

/**
 * Lazily initialise Analytics only in the browser and only where supported
 * (it throws in unsupported environments). Never blocks the main thread.
 */
export async function initAnalytics() {
  if (typeof window === "undefined" || !firebaseConfig.measurementId) return null;
  try {
    const { getAnalytics, isSupported } = await import("firebase/analytics");
    if (await isSupported()) return getAnalytics(getFirebaseApp());
  } catch {
    /* analytics is non-critical */
  }
  return null;
}
