import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";

export const runtime = "nodejs";

/**
 * Razorpay webhook — the authoritative, async source of truth for a payment's
 * final state (handles captured / failed even if the browser closed mid-flow).
 * Verifies the signature against the RAW body before trusting anything.
 * Configure the endpoint + secret in the Razorpay dashboard (RAZORPAY_WEBHOOK_SECRET).
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: {
      payment?: {
        entity?: { id?: string; order_id?: string; notes?: Record<string, string> };
      };
    };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const type = event.event;
  const entity = event.payload?.payment?.entity;
  const orderId = entity?.order_id;
  const uid = entity?.notes?.uid;

  if (orderId && uid && (type === "payment.captured" || type === "payment.failed")) {
    const paid = type === "payment.captured";
    await getAdminDb()
      .collection("users")
      .doc(uid)
      .collection("razorpayOrders")
      .doc(orderId)
      .set(
        {
          status: paid ? "paid" : "failed",
          paymentId: entity?.id ?? null,
          updatedAt: Date.now(),
          ...(paid ? { paidAt: Date.now() } : {}),
        },
        { merge: true },
      )
      .catch(() => {});
  }

  return NextResponse.json({ received: true });
}
