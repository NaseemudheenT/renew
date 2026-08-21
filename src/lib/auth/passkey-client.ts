"use client";

import { useSyncExternalStore } from "react";
import {
  startRegistration,
  startAuthentication,
} from "@simplewebauthn/browser";
import { signInWithCustomTokenAndSession, AuthError } from "@/lib/auth/client";

/** Passkeys need a platform with WebAuthn (all modern browsers/devices). */
export function isPasskeySupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined"
  );
}

const noop = () => () => {};

/** Hydration-safe passkey-support flag (false on the server, real value on the client). */
export function usePasskeySupport(): boolean {
  return useSyncExternalStore(noop, isPasskeySupported, () => false);
}

/** Add a passkey (Face ID / Touch ID / device unlock) to the signed-in account. */
export async function registerPasskey(): Promise<void> {
  const optRes = await fetch("/api/auth/passkey/register/options", {
    method: "POST",
  });
  if (!optRes.ok) {
    throw new AuthError("passkey/options", "Couldn't start passkey setup.");
  }
  const options = await optRes.json();

  let attestation;
  try {
    attestation = await startRegistration({ optionsJSON: options });
  } catch {
    throw new AuthError("passkey/cancelled", "Passkey setup was cancelled.");
  }

  const verifyRes = await fetch("/api/auth/passkey/register/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ response: attestation }),
  });
  if (!verifyRes.ok) {
    const d = (await verifyRes.json().catch(() => ({}))) as { error?: string };
    throw new AuthError("passkey/verify", d.error ?? "Couldn't save the passkey.");
  }
}

/** Sign in with a passkey — the device prompts for Face ID / Touch ID. */
export async function signInWithPasskey(): Promise<void> {
  const optRes = await fetch("/api/auth/passkey/authenticate/options", {
    method: "POST",
  });
  if (!optRes.ok) {
    throw new AuthError("passkey/options", "Couldn't start passkey sign-in.");
  }
  const options = await optRes.json();

  let assertion;
  try {
    assertion = await startAuthentication({ optionsJSON: options });
  } catch {
    throw new AuthError("passkey/cancelled", "Passkey sign-in was cancelled.");
  }

  const verifyRes = await fetch("/api/auth/passkey/authenticate/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ response: assertion }),
  });
  const data = (await verifyRes.json().catch(() => ({}))) as {
    token?: string;
    error?: string;
  };
  if (!verifyRes.ok || !data.token) {
    throw new AuthError("passkey/verify", data.error ?? "Passkey sign-in failed.");
  }
  await signInWithCustomTokenAndSession(data.token);
}
