import "server-only";

import {
  getApps,
  initializeApp,
  cert,
  type App,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getServerEnv } from "@/lib/env";

/**
 * LAZY Firebase Admin (server-only). Used for trusted writes / webhooks.
 * Never imported by client code (`server-only` guards it).
 */

let adminApp: App | null = null;

interface ServiceAccountJson {
  project_id: string;
  client_email: string;
  private_key: string;
}

function parseServiceAccount(): ServiceAccountJson {
  const raw = getServerEnv().firebaseServiceAccountKey;
  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not set.");
  }
  let json: ServiceAccountJson;
  try {
    json = JSON.parse(raw) as ServiceAccountJson;
  } catch {
    // Some platforms hold the key base64-encoded — decode and retry once.
    try {
      json = JSON.parse(
        Buffer.from(raw, "base64").toString("utf8"),
      ) as ServiceAccountJson;
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON.");
    }
  }
  // Support both literal and escaped newlines in the private key.
  json.private_key = json.private_key.replace(/\\n/g, "\n");
  return json;
}

export function getAdminApp(): App {
  if (adminApp) return adminApp;
  if (getApps().length) {
    adminApp = getApps()[0]!;
    return adminApp;
  }
  const sa = parseServiceAccount();
  adminApp = initializeApp({
    credential: cert({
      projectId: sa.project_id,
      clientEmail: sa.client_email,
      privateKey: sa.private_key,
    }),
  });
  return adminApp;
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}
