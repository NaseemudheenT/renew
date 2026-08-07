/**
 * Centralised, typed access to environment variables.
 *
 * NEXT_PUBLIC_* values are referenced statically (never via a dynamic key) so
 * Next.js can inline them into the client bundle. Server-only secrets are read
 * lazily through getServerEnv() and must never be imported into client code.
 */

/** Read a public var, throwing a clear error if it is required but missing. */
function pub(value: string | undefined, key: string, required = true): string {
  if (!value && required) {
    // Fail loud in dev; in prod we still return "" so a single missing var
    // doesn't crash the whole app — the specific feature degrades instead.
    if (process.env.NODE_ENV !== "production") {
      throw new Error(`[env] Missing required public variable: ${key}`);
    }
  }
  return value ?? "";
}

export const clientEnv = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || "RENEW",
  parentCompany: process.env.NEXT_PUBLIC_PARENT_COMPANY || "ZAP",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  firebase: {
    apiKey: pub(process.env.NEXT_PUBLIC_FIREBASE_API_KEY, "NEXT_PUBLIC_FIREBASE_API_KEY"),
    authDomain: pub(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
    projectId: pub(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, "NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
    storageBucket: pub(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: pub(
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    ),
    appId: pub(process.env.NEXT_PUBLIC_FIREBASE_APP_ID, "NEXT_PUBLIC_FIREBASE_APP_ID"),
    measurementId: pub(
      process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
      "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID",
      false,
    ),
  },

  cloudinaryCloudName: pub(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
    false,
  ),

  posthog: {
    key: process.env.NEXT_PUBLIC_POSTHOG_KEY || "",
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
  },

  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",

  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
} as const;

/** Server-only environment. Throws if imported/used on the client. */
export function getServerEnv() {
  if (typeof window !== "undefined") {
    throw new Error("[env] getServerEnv() must only be called on the server.");
  }
  return {
    firebaseServiceAccount: process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "",
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
      apiKey: process.env.CLOUDINARY_API_KEY || "",
      apiSecret: process.env.CLOUDINARY_API_SECRET || "",
    },
    resend: {
      apiKey: process.env.RESEND_API_KEY || "",
      from: process.env.RESEND_FROM_EMAIL || "Renew <onboarding@resend.dev>",
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY || "",
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    },
    sentryDsn: process.env.SENTRY_DSN || "",
  } as const;
}
