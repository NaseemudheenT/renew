"use client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCustomToken,
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  GoogleAuthProvider,
  OAuthProvider,
  updateProfile,
  sendPasswordResetEmail,
  signOut,
  type User,
  type ConfirmationResult,
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
  "auth/cancelled-popup-request": "Sign-in was cancelled.",
  "auth/popup-blocked": "Your browser blocked the sign-in popup. Allow popups and try again.",
  "auth/network-request-failed": "Network error. Check your connection.",
  "auth/operation-not-allowed":
    "Apple sign-in isn't enabled for this project yet.",
  "auth/account-exists-with-different-credential":
    "This email is already linked to a different sign-in method.",
  "auth/api-key-not-valid.-please-pass-a-valid-api-key.":
    "This app's Firebase API key is misconfigured. Please contact support.",
  "auth/api-key-not-valid":
    "This app's Firebase API key is misconfigured. Please contact support.",
  "auth/invalid-api-key":
    "This app's Firebase API key is misconfigured. Please contact support.",
  "auth/unauthorized-domain":
    "This domain isn't authorized for sign-in yet. Please contact support.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/requires-recent-login": "Please sign in again to continue.",
  "auth/invalid-phone-number": "That doesn't look like a valid phone number.",
  "auth/missing-phone-number": "Enter your phone number to continue.",
  "auth/invalid-verification-code": "That code isn't right. Check it and try again.",
  "auth/code-expired": "That code expired. Request a new one.",
  "auth/missing-verification-code": "Enter the 6-digit code we sent you.",
  "auth/quota-exceeded": "Too many codes sent. Please try again later.",
  "auth/captcha-check-failed": "Verification failed. Please reload and try again.",
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
  // Show a friendly message when we recognise the code; otherwise surface the
  // real code so failures are diagnosable instead of hidden behind one string.
  const fallback =
    code && code !== "auth/unknown"
      ? `Sign-in failed (${code}). Please try again.`
      : "Something went wrong. Please try again.";
  return new AuthError(code, ERROR_MESSAGES[code] ?? fallback);
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

/**
 * Keep returning users signed in: if the Firebase client still has a user (its
 * persistence is indefinite), silently re-mint the server session so they go
 * straight into Renew without seeing the login screen. Returns false if there's
 * no signed-in user (they've genuinely logged out) or it couldn't refresh.
 */
export async function resumeSession(): Promise<boolean> {
  const user = getFirebaseAuth().currentUser;
  if (!user) return false;
  try { await establishSession(user, true); return true; } catch { return false; }
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

/** Complete sign-in from a Firebase custom token (minted after passkey auth). */
export async function signInWithCustomTokenAndSession(token: string): Promise<void> {
  const auth = getFirebaseAuth();
  try {
    const { user } = await signInWithCustomToken(auth, token);
    await establishSession(user, true);
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

/**
 * Sign in with Apple via Firebase's generic OAuth provider ("apple.com").
 * Requires the Apple provider to be enabled in Firebase Auth (Service ID, Apple
 * Team ID, Key ID and private key) — see the config note reported to the owner.
 * When it isn't enabled Firebase returns `auth/operation-not-allowed`, which we
 * surface as a clear message rather than a crash.
 */
export async function signInWithApple(): Promise<void> {
  const auth = getFirebaseAuth();
  const provider = new OAuthProvider("apple.com");
  provider.addScope("email");
  provider.addScope("name");
  try {
    const { user } = await signInWithPopup(auth, provider);
    await establishSession(user, true);
  } catch (err) {
    throw toAuthError(err);
  }
}

/* ---- Passwordless phone (OTP) — Renew's primary sign-in ------------------ */

let phoneConfirmation: ConfirmationResult | null = null;
let recaptcha: RecaptchaVerifier | null = null;

/**
 * Lazily build ONE invisible reCAPTCHA verifier bound to `containerId`. Firebase
 * requires an app verifier for web phone auth; "invisible" means a normal user
 * never sees a challenge, and registered test numbers bypass it entirely.
 */
function getPhoneRecaptcha(containerId: string): RecaptchaVerifier {
  if (recaptcha) return recaptcha;
  recaptcha = new RecaptchaVerifier(getFirebaseAuth(), containerId, {
    size: "invisible",
  });
  return recaptcha;
}

/** Tear down the verifier so a fresh challenge can be created after an error. */
export function resetPhoneRecaptcha(): void {
  try {
    recaptcha?.clear();
  } catch {
    /* already cleared */
  }
  recaptcha = null;
}

/** Send an SMS code to an E.164 number (e.g. +919000000001). */
export async function startPhoneSignIn(
  phoneE164: string,
  containerId: string,
): Promise<void> {
  const auth = getFirebaseAuth();
  try {
    const verifier = getPhoneRecaptcha(containerId);
    phoneConfirmation = await signInWithPhoneNumber(auth, phoneE164, verifier);
  } catch (err) {
    resetPhoneRecaptcha();
    throw toAuthError(err);
  }
}

/** Confirm the 6-digit code and establish the httpOnly session. */
export async function confirmPhoneCode(code: string): Promise<void> {
  if (!phoneConfirmation) {
    throw new AuthError(
      "auth/missing-verification-code",
      "Please request a code first.",
    );
  }
  try {
    const { user } = await phoneConfirmation.confirm(code);
    await establishSession(user, true);
    phoneConfirmation = null;
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
