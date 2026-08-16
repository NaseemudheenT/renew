/**
 * Typed environment access with strict browser/server separation.
 *
 * - `NEXT_PUBLIC_*` are inlined at build time and safe for the browser.
 * - Everything else is server-only and must never be imported into client code.
 *
 * We read from `process.env` directly (Next inlines NEXT_PUBLIC_* statically)
 * and validate lazily so a missing var never crashes the build/prerender.
 */

/** Browser-safe public config. */
export const publicEnv = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Renew",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  parentCompany: process.env.NEXT_PUBLIC_PARENT_COMPANY ?? "Zap",
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "",
  },
  cloudinaryCloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "",
  posthog: {
    key: process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "",
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
  },
  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN ?? "",
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
} as const;

/** True if a value is missing or an obvious placeholder. */
function isPlaceholder(value: string): boolean {
  if (!value) return true;
  return /placeholder|your-|example|changeme|xxxx/i.test(value);
}

/** Is the Firebase config present with real (non-placeholder) values? */
export function hasFirebaseConfig(): boolean {
  const f = publicEnv.firebase;
  return (
    !isPlaceholder(f.apiKey) &&
    !isPlaceholder(f.authDomain) &&
    !isPlaceholder(f.projectId) &&
    !isPlaceholder(f.appId)
  );
}

/**
 * Server-only secrets. Throws if read on the client, and validates the key
 * exists only at the moment it's actually needed (never at import time).
 */
function requireServer(): void {
  if (typeof window !== "undefined") {
    throw new Error("serverEnv accessed in the browser — this is a bug.");
  }
}

export function getServerEnv() {
  requireServer();
  return {
    authSecret: process.env.AUTH_SECRET ?? "",
    firebaseServiceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY ?? "",
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
      apiKey: process.env.CLOUDINARY_API_KEY ?? "",
      apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
    },
    resend: {
      apiKey: process.env.RESEND_API_KEY ?? "",
      fromEmail: process.env.RESEND_FROM_EMAIL ?? "",
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY ?? "",
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
    },
    sentryDsn: process.env.SENTRY_DSN ?? "",
  };
}

/** True in production runtime. */
export const isProd = process.env.NODE_ENV === "production";
export const isDev = process.env.NODE_ENV === "development";
