import "server-only";

import crypto from "node:crypto";
import { getServerEnv } from "@/lib/env";

/**
 * RENEW — Razorpay (server-only). Order creation + signature verification via
 * the Razorpay REST API and Node crypto. No SDK dependency. The Key Secret is
 * read only here (server) and is never logged, returned, or sent to the client.
 */

const RZP_API = "https://api.razorpay.com/v1";

export function isRazorpayConfigured(): boolean {
  const { razorpay } = getServerEnv();
  return Boolean(razorpay.keyId && razorpay.keySecret);
}

function authHeader(): string {
  const { razorpay } = getServerEnv();
  const token = Buffer.from(`${razorpay.keyId}:${razorpay.keySecret}`).toString(
    "base64",
  );
  return `Basic ${token}`;
}

export interface RazorpayOrder {
  id: string;
  amount: number; // minor units (paise)
  currency: string;
  status: string;
  receipt?: string;
}

/**
 * Create a Razorpay order. `amount` is a DECIMAL major-unit amount (e.g. 499.00);
 * Razorpay wants integer minor units, so we convert here.
 */
export async function createRazorpayOrder(input: {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  const minor = Math.round(input.amount * 100);
  if (!Number.isFinite(minor) || minor < 100) {
    throw new Error("Amount must be at least 1.00.");
  }
  const res = await fetch(`${RZP_API}/orders`, {
    method: "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: minor,
      currency: input.currency,
      receipt: input.receipt,
      notes: input.notes ?? {},
    }),
  });
  if (!res.ok) {
    // Surface a safe, generic error — never the response body (may echo config).
    throw new Error(`Razorpay order creation failed (${res.status}).`);
  }
  return (await res.json()) as RazorpayOrder;
}

/** Constant-time hex comparison. */
function timingSafeEqualHex(a: string, b: string): boolean {
  let ba: Buffer;
  let bb: Buffer;
  try {
    ba = Buffer.from(a, "hex");
    bb = Buffer.from(b, "hex");
  } catch {
    return false;
  }
  if (ba.length === 0 || ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/** Verify the Checkout success signature: HMAC_SHA256(order_id|payment_id). */
export function verifyPaymentSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const { razorpay } = getServerEnv();
  if (!razorpay.keySecret) return false;
  const expected = crypto
    .createHmac("sha256", razorpay.keySecret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");
  return timingSafeEqualHex(expected, input.signature);
}

/** Verify a Razorpay webhook signature against the RAW request body. */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
): boolean {
  const { razorpay } = getServerEnv();
  if (!razorpay.webhookSecret) return false;
  const expected = crypto
    .createHmac("sha256", razorpay.webhookSecret)
    .update(rawBody)
    .digest("hex");
  return timingSafeEqualHex(expected, signature);
}
