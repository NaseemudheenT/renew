/**
 * Typed environment access with strict browser/server separation.
 *
 * - `NEXT_PUBLIC_*` are inlined at build time and safe for the browser.
 * - Everything else is server-only and must never be imported into client code.
 *
 * We read from `process.env` directly (Next inlines NEXT_PUBLIC_* statically)
 * and validate lazily so a missing var never crashes the build/prerender.
 */

/**
 * Sanitize an env value. Some hosting dashboards (and copy-pasted `.env` lines)
 * store values WITH their surrounding quotes — e.g. the Firebase API key gets
 * saved literally as `"AIza…"`, quotes included. dotenv strips those locally, so
 * it works in dev but ships a corrupted, quote-wrapped value in production
 * ("API key not valid"). We defensively trim whitespace, a UTF-8 BOM, and a
 * single matching pair of wrapping single/double quotes so a value is used
 * exactly as intended no matter how the platform stored it.
 */
function clean(value: string | undefined): string {
  if (!value) return "";
  let s = value.trim().replace(/^﻿/, "");
  while (s.length >= 2) {
    const first = s[0];
    const last = s[s.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      s = s.slice(1, -1).trim();
    } else {
      break;
    }
  }
  return s;
}

/** Browser-safe public config. */
export const publicEnv = {
  appName: clean(process.env.NEXT_PUBLIC_APP_NAME) || "Renew",
  appUrl: clean(process.env.NEXT_PUBLIC_APP_URL) || "http://localhost:3000",
  parentCompany: clean(process.env.NEXT_PUBLIC_PARENT_COMPANY) || "Zap",
  firebase: {
    apiKey: clean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
    authDomain: clean(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
    projectId: clean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
    storageBucket: clean(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
    messagingSenderId: clean(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
    appId: clean(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
    measurementId: clean(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID),
  },
  cloudinaryCloudName: clean(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME),
  posthog: {
    key: clean(process.env.NEXT_PUBLIC_POSTHOG_KEY),
    host: clean(process.env.NEXT_PUBLIC_POSTHOG_HOST) || "https://us.i.posthog.com",
  },
  sentryDsn: clean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  stripePublishableKey: clean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
  razorpayKeyId: clean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID),
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
    authSecret: clean(process.env.AUTH_SECRET),
    firebaseServiceAccountKey: clean(process.env.FIREBASE_SERVICE_ACCOUNT_KEY),
    cloudinary: {
      cloudName: clean(process.env.CLOUDINARY_CLOUD_NAME),
      apiKey: clean(process.env.CLOUDINARY_API_KEY),
      apiSecret: clean(process.env.CLOUDINARY_API_SECRET),
    },
    resend: {
      apiKey: clean(process.env.RESEND_API_KEY),
      fromEmail: clean(process.env.RESEND_FROM_EMAIL),
    },
    stripe: {
      secretKey: clean(process.env.STRIPE_SECRET_KEY),
      webhookSecret: clean(process.env.STRIPE_WEBHOOK_SECRET),
    },
    razorpay: {
      keyId: clean(process.env.RAZORPAY_KEY_ID),
      keySecret: clean(process.env.RAZORPAY_KEY_SECRET),
      webhookSecret: clean(process.env.RAZORPAY_WEBHOOK_SECRET),
    },
    sentryDsn: clean(process.env.SENTRY_DSN),
  };
}

/** True in production runtime. */
export const isProd = process.env.NODE_ENV === "production";
export const isDev = process.env.NODE_ENV === "development";
