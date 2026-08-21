import "server-only";

import crypto from "node:crypto";
import type {
  AuthenticatorTransportFuture,
  WebAuthnCredential,
} from "@simplewebauthn/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { getServerEnv } from "@/lib/env";

/**
 * RENEW — passkey (WebAuthn) server helpers. The crypto is handled by the
 * industry-standard @simplewebauthn library; this module owns Renew's glue:
 * relying-party config derived from the request, a signed short-lived challenge
 * cookie (no server storage needed), and the Firestore credential store.
 *
 * Passkeys let a person sign in with Face ID / Touch ID / device unlock — the
 * most phishing-resistant login there is.
 */

export const RP_NAME = "Renew";
export const CHALLENGE_COOKIE = "renew_pk_chal";

/** Relying-party id (bare host) + full origin, from the incoming request. */
export function rpFromRequest(request: Request): { rpID: string; origin: string } {
  const host = request.headers.get("host") ?? "localhost:3000";
  const hostname = host.split(":")[0] ?? "localhost";
  const proto =
    request.headers.get("x-forwarded-proto") ??
    (hostname === "localhost" ? "http" : "https");
  return { rpID: hostname, origin: `${proto}://${host}` };
}

/* ---- Signed challenge cookie -------------------------------------------- */

function sign(value: string): string {
  const secret = getServerEnv().authSecret || "renew-passkey-fallback-secret";
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

/** Build the cookie value that carries a challenge, tamper-proofed with an HMAC. */
export function makeChallengeCookie(challenge: string): string {
  return `${challenge}.${sign(challenge)}`;
}

/** Recover a verified challenge from the cookie, or null if missing/tampered. */
export function readChallengeCookie(cookieValue: string | undefined): string | null {
  if (!cookieValue) return null;
  const idx = cookieValue.lastIndexOf(".");
  if (idx <= 0) return null;
  const challenge = cookieValue.slice(0, idx);
  const expected = makeChallengeCookie(challenge);
  const a = Buffer.from(cookieValue);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  return crypto.timingSafeEqual(a, b) ? challenge : null;
}

/* ---- Credential store (Firestore, server-only) -------------------------- */

export interface StoredPasskey {
  credentialID: string; // base64url
  uid: string;
  publicKey: string; // base64url of the COSE public key
  counter: number;
  transports?: AuthenticatorTransportFuture[];
  createdAt: number;
  label?: string;
}

const col = () => getAdminDb().collection("passkeys");

export async function getUserPasskeys(uid: string): Promise<StoredPasskey[]> {
  const snap = await col().where("uid", "==", uid).get();
  return snap.docs.map((d) => d.data() as StoredPasskey);
}

export async function getPasskey(credentialID: string): Promise<StoredPasskey | null> {
  const doc = await col().doc(credentialID).get();
  return doc.exists ? (doc.data() as StoredPasskey) : null;
}

export async function savePasskey(record: StoredPasskey): Promise<void> {
  await col().doc(record.credentialID).set(record);
}

export async function bumpPasskeyCounter(
  credentialID: string,
  counter: number,
): Promise<void> {
  await col().doc(credentialID).set({ counter }, { merge: true });
}

/* ---- Encoding helpers ---------------------------------------------------- */

export function publicKeyToString(publicKey: Uint8Array): string {
  return Buffer.from(publicKey).toString("base64url");
}
export function publicKeyFromString(value: string): Uint8Array<ArrayBuffer> {
  const buf = Buffer.from(value, "base64url");
  const out = new Uint8Array(new ArrayBuffer(buf.byteLength));
  out.set(buf);
  return out;
}

/** Shape a stored passkey into the credential the verifier expects. */
export function toWebAuthnCredential(p: StoredPasskey): WebAuthnCredential {
  return {
    id: p.credentialID,
    publicKey: publicKeyFromString(p.publicKey),
    counter: p.counter,
    transports: p.transports,
  };
}
