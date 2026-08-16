# Deploying Renew

Renew is a standard Next.js 16 app plus a Firebase backend. Going live is ~15
minutes. Follow these steps in order.

## 1. Firebase project

1. Create a project at <https://console.firebase.google.com>.
2. **Authentication → Sign-in method:** enable **Email/Password** and **Google**.
3. **Firestore Database:** create a database (production mode).
4. **Project settings → General:** register a **Web app** and copy the config —
   these become the `NEXT_PUBLIC_FIREBASE_*` values.
5. **Project settings → Service accounts:** click *Generate new private key*.
   Stringify the downloaded JSON to a single line and set it as
   `FIREBASE_SERVICE_ACCOUNT_KEY`.

## 2. Environment variables

Copy `.env.example` → `.env.local` (local) or set them in your host (Vercel).
Required for core functionality:

- `NEXT_PUBLIC_FIREBASE_*` (7 values) and `FIREBASE_SERVICE_ACCOUNT_KEY`
- `AUTH_SECRET` — any long random string
- `NEXT_PUBLIC_APP_URL` — your deployed URL

Optional (features degrade gracefully without them):

- **Cloudinary** (`CLOUDINARY_*`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`) — document uploads
- **Resend** (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`) — OTP emails (in dev the code
  is logged to the server console when Resend isn't set)
- **Stripe / PostHog / Sentry** — billing and observability

## 3. Deploy the Firestore security rules (required)

The rules in `firestore.rules` are the production authorization boundary — they
let each user read/write only their own data. Deploy them:

```bash
npm i -g firebase-tools
firebase login
firebase use --add            # select your project
firebase deploy --only firestore:rules
```

> Without this, Firestore uses its default rules and the app cannot read/write
> user data. `firebase.json` and `firestore.indexes.json` are already included.

## 4. Deploy the app (Vercel)

1. Push this repo to GitHub (already done for the owner).
2. Import it at <https://vercel.com/new>. Framework preset: **Next.js**.
3. Add every environment variable from step 2 in the Vercel project settings.
4. Deploy. Set `NEXT_PUBLIC_APP_URL` to the final domain and redeploy.
5. In Firebase **Authentication → Settings → Authorized domains**, add your
   Vercel domain so Google sign-in works.

## 5. Verify

- Visit the site → **Create account** → check the email (or dev console) for the
  OTP → verify → onboard → land on the dashboard.
- Create a reminder, a task, a payment, upload a document — confirm each appears
  and persists on refresh.
- Toggle light/dark, install the PWA, and test on a phone.

That's it — Renew is live.
