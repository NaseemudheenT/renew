"use client";

/**
 * Firebase client SDK — browser only.
 * Initialised as a singleton so hot-reloads and multiple imports never create
 * duplicate apps. Analytics is loaded lazily and only when supported.
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

export const firebaseApp: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(firebaseApp);
export const db: Firestore = getFirestore(firebaseApp);
export const storage: FirebaseStorage = getStorage(firebaseApp);

// Keep the session across reloads/tabs. Guarded so SSR never touches it.
if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch(() => {
    /* persistence can fail in private mode — auth still works in-memory */
  });
}

/**
 * Lazily initialise Analytics only in the browser and only where supported
 * (it throws in unsupported environments). Never blocks the main thread.
 */
export async function initAnalytics() {
  if (typeof window === "undefined" || !firebaseConfig.measurementId) return null;
  try {
    const { getAnalytics, isSupported } = await import("firebase/analytics");
    if (await isSupported()) return getAnalytics(firebaseApp);
  } catch {
    /* analytics is non-critical */
  }
  return null;
}
