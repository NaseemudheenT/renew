import { NextResponse } from "next/server";
import { QR_POLL_COOKIE, QR_TTL_MS, qrDoc, randomId, sha256, packPoll, type QrSessionDoc } from "@/lib/auth/qr.server";

export const runtime = "nodejs";

/** Start a QR pairing: create a server-only session, hand the browser an
 *  httpOnly poll cookie, and return the sessionId to encode into the QR. */
export async function POST() {
  const sessionId = randomId(24);
  const secret = randomId(24);
  const now = Date.now();
  const doc: QrSessionDoc = {
    status: "pending",
    pollHash: sha256(secret),
    createdAt: now,
    expiresAt: now + QR_TTL_MS,
  };
  await qrDoc(sessionId).set(doc);

  const res = NextResponse.json({ sessionId, expiresIn: Math.floor(QR_TTL_MS / 1000) });
  res.cookies.set(QR_POLL_COOKIE, packPoll(sessionId, secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/qr",
    maxAge: Math.floor(QR_TTL_MS / 1000) + 10,
  });
  return res;
}
