import "server-only";

import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";

/**
 * Email OTP verification. Codes are 6 digits, hashed at rest, single-collection
 * (`emailOtps/{uid}`), rate-limited, and expire quickly. On success the caller
 * marks the Firebase user emailVerified. This is our own premium verification
 * flow (Resend-delivered) rather than Firebase's email-link default.
 */

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 30 * 1000; // 30s between sends
const MAX_SENDS_PER_WINDOW = 5;
const SEND_WINDOW_MS = 60 * 60 * 1000; // per hour
const MAX_ATTEMPTS = 5;

function hashCode(uid: string, code: string): string {
  return createHash("sha256").update(`${uid}:${code}`).digest("hex");
}

export interface OtpSendResult {
  ok: boolean;
  code?: string; // only returned to the caller so it can email it
  error?: "cooldown" | "rate-limited";
  retryAfterMs?: number;
}

/** Create + persist a new code for a user. Returns the plaintext to email. */
export async function issueOtp(uid: string): Promise<OtpSendResult> {
  const ref = getAdminDb().collection("emailOtps").doc(uid);
  const now = Date.now();
  const snap = await ref.get();
  const data = snap.data();

  if (data) {
    const lastSentAt: number = data.lastSentAt ?? 0;
    if (now - lastSentAt < RESEND_COOLDOWN_MS) {
      return {
        ok: false,
        error: "cooldown",
        retryAfterMs: RESEND_COOLDOWN_MS - (now - lastSentAt),
      };
    }
    const windowStart: number = data.windowStart ?? 0;
    const sends: number = data.sends ?? 0;
    if (now - windowStart < SEND_WINDOW_MS && sends >= MAX_SENDS_PER_WINDOW) {
      return {
        ok: false,
        error: "rate-limited",
        retryAfterMs: SEND_WINDOW_MS - (now - windowStart),
      };
    }
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const withinWindow = data && now - (data.windowStart ?? 0) < SEND_WINDOW_MS;

  await ref.set(
    {
      codeHash: hashCode(uid, code),
      expiresAt: now + CODE_TTL_MS,
      attempts: 0,
      lastSentAt: now,
      windowStart: withinWindow ? data.windowStart : now,
      sends: withinWindow ? (data.sends ?? 0) + 1 : 1,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return { ok: true, code };
}

export interface OtpVerifyResult {
  ok: boolean;
  error?: "expired" | "invalid" | "too-many-attempts" | "not-found";
  attemptsLeft?: number;
}

/** Verify a submitted code. Consumes the code on success. */
export async function verifyOtp(
  uid: string,
  submitted: string,
): Promise<OtpVerifyResult> {
  const ref = getAdminDb().collection("emailOtps").doc(uid);
  const snap = await ref.get();
  const data = snap.data();
  if (!data) return { ok: false, error: "not-found" };

  if (Date.now() > (data.expiresAt ?? 0)) {
    return { ok: false, error: "expired" };
  }
  if ((data.attempts ?? 0) >= MAX_ATTEMPTS) {
    return { ok: false, error: "too-many-attempts" };
  }

  const expected = Buffer.from(data.codeHash ?? "", "hex");
  const actual = Buffer.from(hashCode(uid, submitted), "hex");
  const match =
    expected.length === actual.length && timingSafeEqual(expected, actual);

  if (!match) {
    const attempts = (data.attempts ?? 0) + 1;
    await ref.set({ attempts }, { merge: true });
    return {
      ok: false,
      error: "invalid",
      attemptsLeft: Math.max(0, MAX_ATTEMPTS - attempts),
    };
  }

  // Success — burn the code.
  await ref.delete();
  return { ok: true };
}
