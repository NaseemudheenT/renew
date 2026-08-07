import "server-only";

/**
 * Stateless email-OTP engine.
 *
 * A 6-digit code is generated server-side, hashed, and packed with the target
 * email and an expiry into a compact token that is HMAC-signed with AUTH_SECRET.
 * The token lives in an HttpOnly cookie — so verification needs no database and
 * the plaintext code never leaves the server except inside the email. The
 * client can neither read nor forge it.
 *
 * Uses Web Crypto (works in both Node and Edge runtimes).
 */
import { getServerEnv } from "@/lib/env";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

export const OTP_COOKIE = "renew_otp";

function enc(data: string) {
  return new TextEncoder().encode(data);
}

function b64url(bytes: ArrayBuffer | Uint8Array) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  for (const b of arr) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function getKey() {
  const secret = getServerEnv().authSecret;
  if (!secret) throw new Error("[otp] AUTH_SECRET is not set.");
  return crypto.subtle.importKey("raw", enc(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
}

async function hmac(payload: string) {
  const key = await getKey();
  const sig = await crypto.subtle.sign("HMAC", key, enc(payload));
  return b64url(sig);
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", enc(value));
  return b64url(digest);
}

/** Constant-time-ish string comparison. */
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function generateCode(): string {
  // Cryptographically random 6-digit code (100000–999999).
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 900000;
  return String(100000 + n);
}

interface TokenBody {
  email: string;
  codeHash: string;
  exp: number;
  attempts: number;
}

/** Create a signed OTP token (to be stored in an HttpOnly cookie). */
export async function createOtpToken(email: string, code: string): Promise<string> {
  const body: TokenBody = {
    email: email.toLowerCase().trim(),
    codeHash: await sha256(`${email.toLowerCase().trim()}:${code}`),
    exp: Date.now() + OTP_TTL_MS,
    attempts: 0,
  };
  const payload = b64url(enc(JSON.stringify(body)));
  const sig = await hmac(payload);
  return `${payload}.${sig}`;
}

type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "expired" | "mismatch" | "throttled"; token?: string };

/** Verify a submitted code against the signed token. */
export async function verifyOtpToken(
  token: string | undefined,
  email: string,
  code: string,
): Promise<VerifyResult> {
  if (!token) return { ok: false, reason: "invalid" };
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return { ok: false, reason: "invalid" };

  const expected = await hmac(payload);
  if (!safeEqual(sig, expected)) return { ok: false, reason: "invalid" };

  let body: TokenBody;
  try {
    const json = new TextDecoder().decode(
      Uint8Array.from(atob(payload.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)),
    );
    body = JSON.parse(json) as TokenBody;
  } catch {
    return { ok: false, reason: "invalid" };
  }

  if (Date.now() > body.exp) return { ok: false, reason: "expired" };
  if (body.attempts >= MAX_ATTEMPTS) return { ok: false, reason: "throttled" };
  if (body.email !== email.toLowerCase().trim()) return { ok: false, reason: "mismatch" };

  const submittedHash = await sha256(`${email.toLowerCase().trim()}:${code}`);
  if (safeEqual(submittedHash, body.codeHash)) return { ok: true };

  // Wrong code — re-issue a token with an incremented attempt counter.
  const next: TokenBody = { ...body, attempts: body.attempts + 1 };
  const nextPayload = b64url(enc(JSON.stringify(next)));
  const nextSig = await hmac(nextPayload);
  return { ok: false, reason: "mismatch", token: `${nextPayload}.${nextSig}` };
}

export { OTP_TTL_MS, MAX_ATTEMPTS };
