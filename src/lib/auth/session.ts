import "server-only";

import { cookies } from "next/headers";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

/** httpOnly session cookie name. Also referenced (presence-only) by proxy.ts. */
export const SESSION_COOKIE = "renew_session";
const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

export interface SessionUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
}

/** Exchange a Firebase ID token for a signed session cookie and set it. */
export async function createSession(idToken: string): Promise<SessionUser> {
  const auth = getAdminAuth();
  // Verify the ID token is fresh (issued in the last 5 min) before minting.
  const decoded = await auth.verifyIdToken(idToken, true);
  if (Date.now() / 1000 - decoded.auth_time > 5 * 60) {
    throw new Error("stale-token");
  }

  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: FIVE_DAYS_MS,
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: FIVE_DAYS_MS / 1000,
  });

  return {
    uid: decoded.uid,
    email: decoded.email ?? null,
    emailVerified: Boolean(decoded.email_verified),
    displayName: (decoded.name as string | undefined) ?? null,
    photoURL: (decoded.picture as string | undefined) ?? null,
  };
}

/** Clear the session cookie (sign out server-side). */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * Verify the current request's session cookie. Returns the user or null.
 * `checkRevoked` forces a lookup so disabled/revoked sessions fail closed.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const cookie = store.get(SESSION_COOKIE)?.value;
  if (!cookie) return null;

  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifySessionCookie(cookie, true);
    // Pull the live emailVerified flag (OTP verification updates it).
    const record = await auth.getUser(decoded.uid);
    return {
      uid: record.uid,
      email: record.email ?? null,
      emailVerified: record.emailVerified,
      displayName: record.displayName ?? null,
      photoURL: record.photoURL ?? null,
    };
  } catch {
    return null;
  }
}

/** Convenience: has this user completed onboarding? Reads users/{uid}. */
export async function getUserFlags(
  uid: string,
): Promise<{ onboarded: boolean }> {
  try {
    const snap = await getAdminDb().collection("users").doc(uid).get();
    const data = snap.data();
    return { onboarded: Boolean(data?.onboarded) };
  } catch {
    return { onboarded: false };
  }
}
