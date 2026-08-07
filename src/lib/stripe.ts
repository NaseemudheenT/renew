import "server-only";

/**
 * Stripe server SDK — singleton.
 * The publishable key belongs on the client (see lib/env clientEnv); this
 * module only ever touches the secret key and must never be imported into a
 * client component.
 */
import Stripe from "stripe";
import { getServerEnv } from "@/lib/env";

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;

  const { secretKey } = getServerEnv().stripe;
  if (!secretKey) {
    throw new Error(
      "[stripe] STRIPE_SECRET_KEY is not set. Add it to .env.local to enable billing.",
    );
  }

  cached = new Stripe(secretKey, {
    // Pinning the account's default API version by omitting the field keeps the
    // SDK and dashboard in sync; typedefs accept omission.
    appInfo: { name: "Renew", url: "https://renew.app" },
    maxNetworkRetries: 2,
    typescript: true,
  });
  return cached;
}

export function isStripeConfigured(): boolean {
  return Boolean(getServerEnv().stripe.secretKey);
}
