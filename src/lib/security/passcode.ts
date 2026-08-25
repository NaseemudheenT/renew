"use client";

/**
 * Renew passcode — a LOCAL app-lock factor (like a banking app's PIN), layered
 * on top of the primary Firebase session. We never store the passcode itself:
 * only a salted SHA-256 hash lives on the user's own profile doc, and it is only
 * ever verified against the account owner (it is convenience/privacy, not the
 * primary auth). Biometric unlock uses the existing passkey (WebAuthn) assertion.
 */

export type PasscodeKind = "pin" | "text" | "pattern";

export interface PasscodeRecord {
  hash: string;
  salt: string;
  kind: PasscodeKind;
  biometricEnabled: boolean;
  updatedAt: number;
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(digest);
}

export function randomSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toHex(bytes.buffer);
}

async function hash(code: string, salt: string): Promise<string> {
  // Salted, lightly iterated — enough for a device app-lock, not a password store.
  let out = `${salt}:${code}`;
  for (let i = 0; i < 5; i++) out = await sha256Hex(out);
  return out;
}

/** Build a storable record for a freshly chosen passcode. */
export async function makePasscodeRecord(
  code: string,
  kind: PasscodeKind,
  biometricEnabled: boolean,
): Promise<PasscodeRecord> {
  const salt = randomSalt();
  return { hash: await hash(code, salt), salt, kind, biometricEnabled, updatedAt: Date.now() };
}

/** Check an entered code against the stored record. */
export async function verifyPasscode(code: string, record: PasscodeRecord): Promise<boolean> {
  const candidate = await hash(code, record.salt);
  // Constant-ish comparison.
  if (candidate.length !== record.hash.length) return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i++) diff |= candidate.charCodeAt(i) ^ record.hash.charCodeAt(i);
  return diff === 0;
}

export function isValidPasscode(code: string, kind: PasscodeKind): boolean {
  if (kind === "pin") return /^\d{4,8}$/.test(code);
  // A pattern is a sequence of connected node indices, e.g. "0-3-6-7".
  if (kind === "pattern") return code.split("-").filter(Boolean).length >= 4;
  return code.trim().length >= 4;
}
