import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { getAdminDb } from "@/lib/firebase/admin";
import { createRazorpayOrder, isRazorpayConfigured } from "@/lib/payments/razorpay";
import { publicEnv } from "@/lib/env";

export const runtime = "nodejs";

const bodySchema = z.object({
  amount: z.number().positive().max(10_000_000),
  currency: z.string().length(3).default("INR"),
  name: z.string().max(120).optional(),
  paymentId: z.string().max(200).optional(),
});

/** Create a Razorpay order for the signed-in user and persist it as pending. */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (!isRazorpayConfigured()) {
    return NextResponse.json({ error: "Payments aren't configured." }, { status: 503 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payment details." }, { status: 400 });
  }

  const { amount, name, paymentId } = parsed.data;
  const currency = parsed.data.currency.toUpperCase();

  try {
    const order = await createRazorpayOrder({
      amount,
      currency,
      receipt: `rnw_${user.uid.slice(0, 8)}_${Date.now()}`,
      notes: {
        uid: user.uid,
        ...(paymentId ? { paymentId } : {}),
        ...(name ? { name } : {}),
      },
    });

    const now = Date.now();
    await getAdminDb()
      .collection("users")
      .doc(user.uid)
      .collection("razorpayOrders")
      .doc(order.id)
      .set({
        orderId: order.id,
        amount,
        currency,
        status: "created",
        name: name ?? null,
        paymentId: paymentId ?? null,
        createdAt: now,
        updatedAt: now,
      });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount, // minor units, for Checkout
      currency: order.currency,
      keyId: publicEnv.razorpayKeyId,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not start the payment. Please try again." },
      { status: 502 },
    );
  }
}
