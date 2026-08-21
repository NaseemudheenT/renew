/**
 * RENEW — Razorpay Checkout (browser). Loads the Checkout script once, creates
 * a server-side order, opens the Checkout, then verifies the result on the
 * server. Returns a single clean status: paid | cancelled | failed | unconfigured.
 * The Key Secret is never touched here — only the public Key ID (from the order
 * response) reaches the browser.
 */

export type PayStatus = "paid" | "cancelled" | "failed" | "unconfigured";
export interface PayResult {
  status: PayStatus;
  message?: string;
  /** Razorpay payment id (present on a verified `paid` result). */
  paymentId?: string;
}

interface RazorpayInstance {
  open(): void;
  on(event: string, handler: (e: unknown) => void): void;
}
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
let scriptPromise: Promise<boolean> | null = null;

function loadScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => {
      scriptPromise = null;
      resolve(false);
    };
    document.body.appendChild(s);
  });
  return scriptPromise;
}

export async function payWithRazorpay(input: {
  amount: number;
  currency?: string;
  name: string;
  description?: string;
  paymentId?: string;
  prefill?: { name?: string; email?: string; contact?: string };
}): Promise<PayResult> {
  // 1) Create the order on the server (auth + secret live there).
  let orderData: {
    orderId?: string;
    amount?: number;
    currency?: string;
    keyId?: string;
    error?: string;
  };
  try {
    const res = await fetch("/api/payments/razorpay/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: input.amount,
        currency: input.currency ?? "INR",
        name: input.name,
        paymentId: input.paymentId,
      }),
    });
    orderData = await res.json().catch(() => ({}));
    if (res.status === 503) return { status: "unconfigured" };
    if (!res.ok || !orderData.orderId || !orderData.keyId) {
      return { status: "failed", message: orderData.error ?? "Could not start payment." };
    }
  } catch {
    return { status: "failed", message: "Network error starting payment." };
  }

  // 2) Load Checkout and open it.
  const loaded = await loadScript();
  if (!loaded || !window.Razorpay) {
    return { status: "failed", message: "Couldn't load the payment window." };
  }

  return new Promise<PayResult>((resolve) => {
    let settled = false;
    const done = (r: PayResult) => {
      if (!settled) {
        settled = true;
        resolve(r);
      }
    };

    const rzp = new window.Razorpay!({
      key: orderData.keyId,
      order_id: orderData.orderId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "Renew",
      description: input.description ?? input.name,
      prefill: input.prefill ?? {},
      theme: { color: "#5a86f5" },
      handler: async (resp: unknown) => {
        const r = resp as {
          razorpay_payment_id?: string;
          razorpay_order_id?: string;
          razorpay_signature?: string;
        };
        try {
          const vRes = await fetch("/api/payments/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: r.razorpay_order_id,
              paymentId: r.razorpay_payment_id,
              signature: r.razorpay_signature,
            }),
          });
          const vData = (await vRes.json().catch(() => ({}))) as {
            status?: string;
            error?: string;
          };
          done(
            vRes.ok && vData.status === "paid"
              ? { status: "paid", paymentId: r.razorpay_payment_id }
              : { status: "failed", message: vData.error ?? "Verification failed." },
          );
        } catch {
          done({ status: "failed", message: "Could not verify the payment." });
        }
      },
      modal: { ondismiss: () => done({ status: "cancelled" }) },
    });

    rzp.on("payment.failed", () =>
      done({ status: "failed", message: "The payment failed. Please try again." }),
    );
    rzp.open();
  });
}
