import "server-only";

/**
 * Resend transactional email — singleton. Used for OTP codes, reminder
 * digests, and account emails. Gracefully reports when unconfigured so calling
 * code can decide how to degrade.
 */
import { Resend } from "resend";
import { getServerEnv } from "@/lib/env";

let cached: Resend | null = null;

export function getResend(): Resend {
  if (cached) return cached;
  const { apiKey } = getServerEnv().resend;
  if (!apiKey) {
    throw new Error("[resend] RESEND_API_KEY is not set. Add it to .env.local to send email.");
  }
  cached = new Resend(apiKey);
  return cached;
}

export function getFromAddress(): string {
  return getServerEnv().resend.from;
}

export function isResendConfigured(): boolean {
  return Boolean(getServerEnv().resend.apiKey);
}
