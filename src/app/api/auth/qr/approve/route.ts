import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getAdminAuth } from "@/lib/firebase/admin";
import { qrDoc, type QrSessionDoc } from "@/lib/auth/qr.server";

export const runtime = "nodejs";

/** The signed-in phone approves a pairing: mint a custom token for THIS user and
 *  attach it to the (server-only) pairing record so the waiting web can sign in. */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in on this device first, then approve." }, { status: 401 });
  }

  let body: { sessionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const sessionId = body.sessionId;
  if (!sessionId) return NextResponse.json({ error: "Missing code." }, { status: 400 });

  const ref = qrDoc(sessionId);
  const snap = await ref.get();
  const data = snap.data() as QrSessionDoc | undefined;
  if (!snap.exists || !data) {
    return NextResponse.json({ error: "This sign-in request wasn't found." }, { status: 404 });
  }
  if (data.status === "approved") {
    return NextResponse.json({ error: "This request was already used." }, { status: 409 });
  }
  if (Date.now() > data.expiresAt) {
    return NextResponse.json({ error: "This sign-in request has expired. Refresh the QR and try again." }, { status: 410 });
  }

  const token = await getAdminAuth().createCustomToken(user.uid);
  await ref.update({ status: "approved", token, approverEmail: user.email ?? null });
  return NextResponse.json({ ok: true });
}
