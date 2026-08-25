import "server-only";
import { createHash, randomBytes } from "crypto";
import { getAdminDb } from "@/lib/firebase/admin";

/**
 * QR sign-in ("scan to sign in", WhatsApp-Web style). Security model:
 * - The pairing record lives in a SERVER-ONLY Firestore collection (rules deny
 *   all client access); only the Admin SDK reads/writes it.
 * - The web that started the pairing holds an httpOnly `poll` cookie bound to
 *   the session; only that browser can retrieve the minted token. A photo of
 *   the QR alone (which carries just the sessionId) cannot pull the token.
 * - The phone must be signed in to approve, which binds the new session to a
 *   real account. Sessions are single-use and expire in two minutes.
 */

export const QR_POLL_COOKIE = "renew_qr_poll";
export const QR_TTL_MS = 120_000;
export const QR_COLLECTION = "qrSessions";

export interface QrSessionDoc {
  status: "pending" | "approved";
  pollHash: string;
  token?: string;
  approverEmail?: string | null;
  createdAt: number;
  expiresAt: number;
}

export function randomId(bytes = 24): string {
  return randomBytes(bytes).toString("hex");
}

export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function qrDoc(sessionId: string) {
  return getAdminDb().collection(QR_COLLECTION).doc(sessionId);
}

/** Encode the poll cookie value (sessionId + the raw poll secret). */
export function packPoll(sessionId: string, secret: string): string {
  return `${sessionId}.${secret}`;
}
export function unpackPoll(value: string | undefined): { sessionId: string; secret: string } | null {
  if (!value) return null;
  const dot = value.indexOf(".");
  if (dot <= 0) return null;
  return { sessionId: value.slice(0, dot), secret: value.slice(dot + 1) };
}
