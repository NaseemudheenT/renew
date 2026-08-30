"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  browserLocalPersistence,
  setPersistence,
  type Auth,
} from "firebase/auth";
import {
  initializeFirestore,
  getFirestore,
  type Firestore,
} from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { publicEnv, hasFirebaseConfig } from "@/lib/env";

/**
 * LAZY Firebase client SDK access.
 *
 * We NEVER call initializeApp/getAuth/getFirestore at module top level — doing
 * so would crash `next build` prerendering when env vars are absent. Everything
 * is created on first use, behind these getters.
 */

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;
let persistenceSet = false;

export function isFirebaseConfigured(): boolean {
  return hasFirebaseConfig();
}

export function getFirebaseApp(): FirebaseApp {
  if (app) return app;
  if (!hasFirebaseConfig()) {
    throw new Error(
      "Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* env vars.",
    );
  }
  app = getApps().length
    ? getApp()
    : initializeApp({
        apiKey: publicEnv.firebase.apiKey,
        authDomain: publicEnv.firebase.authDomain,
        projectId: publicEnv.firebase.projectId,
        storageBucket: publicEnv.firebase.storageBucket,
        messagingSenderId: publicEnv.firebase.messagingSenderId,
        appId: publicEnv.firebase.appId,
        measurementId: publicEnv.firebase.measurementId,
      });
  return app;
}

export function getFirebaseAuth(): Auth {
  if (authInstance) return authInstance;
  authInstance = getAuth(getFirebaseApp());
  // Session persistence across reloads (fire-and-forget; safe to call once).
  if (!persistenceSet) {
    persistenceSet = true;
    void setPersistence(authInstance, browserLocalPersistence).catch(() => {
      /* persistence may be unavailable in some embedded contexts */
    });
  }
  return authInstance;
}

export function getDb(): Firestore {
  if (dbInstance) return dbInstance;
  // Auto-detect long-polling so Firestore still connects behind proxies and in
  // restrictive browsers where the default WebChannel transport is blocked.
  try {
    dbInstance = initializeFirestore(getFirebaseApp(), {
      experimentalAutoDetectLongPolling: true,
      // Optional fields (note, accountId, subcategory, …) arrive as `undefined`
      // when empty. Firestore rejects `undefined` by default, which made every
      // edit of a record with an empty optional field fail with a generic error.
      // Ignoring undefined makes writes drop those fields instead of throwing.
      ignoreUndefinedProperties: true,
    });
  } catch {
    // Already initialized elsewhere — fall back to the existing instance.
    dbInstance = getFirestore(getFirebaseApp());
  }
  return dbInstance;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (storageInstance) return storageInstance;
  storageInstance = getStorage(getFirebaseApp());
  return storageInstance;
}
