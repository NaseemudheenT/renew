import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyPaymentSignature } from "@/lib/payments/razorpay";

export const runtime = "nodejs";

const bodySchema = z.object({
  orderId: z.string().min(6).max(200),
  paymentId: z.string().min(6).max(200),
  signature: z.string().min(6).max(400),
});

/** Verify a completed Checkout payment server-side and record the outcome. */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid verification payload." }, { status: 400 });
  }

  const { orderId, paymentId, signature } = parsed.data;
  const ref = getAdminDb()
    .collection("users")
    .doc(user.uid)
    .collection("razorpayOrders")
    .doc(orderId);

  const authentic = verifyPaymentSignature({ orderId, paymentId, signature });
  if (!authentic) {
    await ref
      .set({ status: "failed", paymentId, updatedAt: Date.now() }, { merge: true })
      .catch(() => {});
    return NextResponse.json(
      { status: "failed", error: "Payment could not be verified." },
      { status: 400 },
    );
  }

  await ref
    .set(
      { status: "paid", paymentId, paidAt: Date.now(), updatedAt: Date.now() },
      { merge: true },
    )
    .catch(() => {});
  return NextResponse.json({ status: "paid" });
}
