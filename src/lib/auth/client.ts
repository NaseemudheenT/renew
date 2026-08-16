"use client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  sendPasswordResetEmail,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";

/** Human-friendly messages for the Firebase error codes we actually surface. */
const ERROR_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "An account already exists with this email.",
  "auth/invalid-email": "That doesn't look like a valid email.",
  "auth/weak-password": "Choose a password with at least 6 characters.",
  "auth/user-not-found": "No account found with those details.",
  "auth/wrong-password": "That email or password isn't right.",
  "auth/invalid-credential": "That email or password isn't right.",
  "auth/too-many-requests": "Too many attempts. Please try again shortly.",
  "auth/popup-closed-by-user": "Sign-in was cancelled.",
  "auth/network-request-failed": "Network error. Check your connection.",
  "auth/account-exists-with-different-credential":
    "This email is already linked to a different sign-in method.",
};

export class AuthError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "AuthError";
  }
}

function toAuthError(err: unknown): AuthError {
  const code =
    typeof err === "object" && err && "code" in err
      ? String((err as { code: unknown }).code)
      : "auth/unknown";
  return new AuthError(code, ERROR_MESSAGES[code] ?? "Something went wrong. Please try again.");
}

/** POST the current user's ID token to mint an httpOnly session cookie. */
async function establishSession(user: User, forceRefresh = false): Promise<void> {
  const idToken = await user.getIdToken(forceRefresh);
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    throw new AuthError("session/failed", "Could not start your session. Please try again.");
  }
}

export async function signUpWithEmail(input: {
  name: string;
  email: string;
  password: string;
}): Promise<void> {
  const auth = getFirebaseAuth();
  try {
    const { user } = await createUserWithEmailAndPassword(
      auth,
      input.email,
      input.password,
    );
    await updateProfile(user, { displayName: input.name.trim() });
    await establishSession(user, true);
  } catch (err) {
    throw toAuthError(err);
  }
}

export async function signInWithEmail(input: {
  email: string;
  password: string;
}): Promise<void> {
  const auth = getFirebaseAuth();
  try {
    const { user } = await signInWithEmailAndPassword(
      auth,
      input.email,
      input.password,
    );
    await establishSession(user);
  } catch (err) {
    throw toAuthError(err);
  }
}

export async function signInWithGoogle(): Promise<void> {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    const { user } = await signInWithPopup(auth, provider);
    await establishSession(user, true);
  } catch (err) {
    throw toAuthError(err);
  }
}

export async function requestOtp(): Promise<{ delivered: boolean }> {
  const res = await fetch("/api/auth/otp/send", { method: "POST" });
  const data = (await res.json().catch(() => ({}))) as {
    delivered?: boolean;
    error?: string;
  };
  if (!res.ok) throw new AuthError("otp/send", data.error ?? "Could not send a code.");
  return { delivered: Boolean(data.delivered) };
}

export async function submitOtp(code: string): Promise<void> {
  const res = await fetch("/api/auth/otp/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new AuthError("otp/verify", data.error ?? "Verification failed.");

  // Refresh the ID token so the new emailVerified claim lands in the session.
  const user = getFirebaseAuth().currentUser;
  if (user) await establishSession(user, true);
}

export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(getFirebaseAuth(), email);
  } catch (err) {
    throw toAuthError(err);
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await signOut(getFirebaseAuth());
  } finally {
    await fetch("/api/auth/session", { method: "DELETE" });
  }
}
