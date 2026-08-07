import "server-only";

/**
 * Firebase Admin SDK — server only.
 * Used for privileged operations: verifying ID tokens in API routes and
 * writing trusted data (e.g. from the Stripe webhook). Initialised as a
 * singleton. Requires FIREBASE_SERVICE_ACCOUNT_KEY (a service-account JSON
 * string). If it is absent, admin features throw a clear, actionable error
 * only when actually used — the rest of the app keeps working.
 */
import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getServerEnv } from "@/lib/env";

const ADMIN_APP_NAME = "renew-admin";

let cachedApp: App | null = null;

function getAdminApp(): App {
  if (cachedApp) return cachedApp;

  const existing = getApps().find((a) => a.name === ADMIN_APP_NAME);
  if (existing) {
    cachedApp = existing;
    return existing;
  }

  const raw = getServerEnv().firebaseServiceAccount;
  if (!raw) {
    throw new Error(
      "[firebase-admin] FIREBASE_SERVICE_ACCOUNT_KEY is not set. " +
        "Generate a private key in Firebase Console → Project Settings → " +
        "Service Accounts, and paste the JSON (single line) into .env.local.",
    );
  }

  let serviceAccount: ServiceAccount;
  try {
    serviceAccount = JSON.parse(raw) as ServiceAccount;
  } catch {
    throw new Error(
      "[firebase-admin] FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON.",
    );
  }

  cachedApp = initializeApp({ credential: cert(serviceAccount) }, ADMIN_APP_NAME);
  return cachedApp;
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

/** Whether admin features are configured (used to gate optional flows). */
export function isAdminConfigured(): boolean {
  return Boolean(getServerEnv().firebaseServiceAccount);
}
