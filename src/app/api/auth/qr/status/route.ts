import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { QR_POLL_COOKIE, qrDoc, sha256, unpackPoll, type QrSessionDoc } from "@/lib/auth/qr.server";

export const runtime = "nodejs";

/** The waiting web polls here. Only the browser holding the httpOnly poll cookie
 *  can retrieve the token; it is single-use (the record is deleted on read). */
export async function GET() {
  const store = await cookies();
  const poll = unpackPoll(store.get(QR_POLL_COOKIE)?.value);
  if (!poll) return NextResponse.json({ status: "idle" });

  const ref = qrDoc(poll.sessionId);
  const snap = await ref.get();
  const data = snap.data() as QrSessionDoc | undefined;
  if (!snap.exists || !data) return NextResponse.json({ status: "expired" });
  if (sha256(poll.secret) !== data.pollHash) {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }
  if (Date.now() > data.expiresAt && data.status !== "approved") {
    await ref.delete().catch(() => {});
    return NextResponse.json({ status: "expired" });
  }

  if (data.status === "approved" && data.token) {
    await ref.delete().catch(() => {}); // single-use
    const res = NextResponse.json({ status: "approved", token: data.token, approverEmail: data.approverEmail ?? null });
    res.cookies.set(QR_POLL_COOKIE, "", { path: "/api/auth/qr", maxAge: 0 });
    return res;
  }
  return NextResponse.json({ status: "pending" });
}
