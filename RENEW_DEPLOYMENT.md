# RENEW — Owner Deployment & Config Runbook

Everything Claude **cannot** do (needs your credentials, web consoles, or changes
your production posture). Do these in order. Firebase project: `the-zap-e7583`.

> Claude has merged all app code to `main` (commit `8f5e7ed`). The steps below
> activate it. **Deploy the Firestore rules before any production deploy** — the
> Accounts/Transfers/Subscriptions screens return `permission-denied` without it.

---

## 1. Firestore rules (do this first)
The rules file `firestore.rules` already contains the new allowlist
(`accounts`, `transfers`, `subscriptions`). Deploy it:

```bash
cd /Users/thajudeen/Documents/Renew
# Write the service-account JSON from .env.local to a temp file (never commit it):
node -e "require('fs').writeFileSync('/tmp/renew-sa.json', process.env.FIREBASE_SERVICE_ACCOUNT_KEY)" --env-file=.env.local
GOOGLE_APPLICATION_CREDENTIALS=/tmp/renew-sa.json npx firebase-tools deploy --only firestore:rules --project the-zap-e7583 --non-interactive
rm -f /tmp/renew-sa.json
```
Verify in Firebase Console → Firestore → Rules that the allowlist includes the 3 new collections.
**Indexes:** none required (all queries are single-collection).

## 2. Vercel deployment
1. Vercel → New Project → import `NaseemudheenT/renew` (or link existing).
2. Framework: Next.js. Build/output: defaults.
3. Add **Environment Variables** (Production + Preview) — names from `.env.example`:
   - Public: `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_URL` (your prod URL), `NEXT_PUBLIC_PARENT_COMPANY`, all `NEXT_PUBLIC_FIREBASE_*`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, optional `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_POSTHOG_*`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
   - Server-only: `FIREBASE_SERVICE_ACCOUNT_KEY` (single-line JSON), `AUTH_SECRET`, `CLOUDINARY_*`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `SENTRY_DSN`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
4. Set `NEXT_PUBLIC_APP_URL` to the deployed origin. Deploy.
5. Firebase Console → Authentication → Settings → **Authorized domains**: add the Vercel domain(s).

## 3. Apple Sign-In (Google already works)
1. Apple Developer → Certificates, IDs & Profiles:
   - App ID + a **Services ID** (this is your Apple `client_id`).
   - Enable "Sign in with Apple"; add return URL: `https://the-zap-e7583.firebaseapp.com/__/auth/handler` (and your custom domain handler if used).
   - Create a **Sign in with Apple key** (.p8) → note Key ID + Team ID.
2. Firebase Console → Authentication → Sign-in method → **Apple** → enable; fill Services ID, Apple Team ID, Key ID, and the `.p8` contents.
3. Add your Vercel domain to Firebase **Authorized domains**.
No app-code change needed — `signInWithApple` is already wired.

## 4. Stripe billing — ⚠️ needs code **and** config (not built yet)
The UI (`CreditCardForm`, Settings→Billing) is provider-safe but there is **no
checkout/webhook code**. To activate, a future build task must add:
- a server route to create a Checkout Session (using `STRIPE_SECRET_KEY`),
- a webhook route verifying `STRIPE_WEBHOOK_SECRET` to sync subscription status,
- product/price setup in Stripe (target: ₹100 / 3 months, localized elsewhere).
Then set the 3 Stripe env vars. Until then, billing stays Free-plan (correct).

## 5. Browser push (FCM) — ⚠️ needs code **and** config
Current browser notifications are **local only** (fire when the tab is open/hidden).
True background push needs: FCM enabled, a **Web Push VAPID key**, a client
`getToken`+token-store flow, an SW `push` handler, and a server sender. Config +
build task — not yet implemented.

## 6. App Check & 2FA/passkeys — ⚠️ needs code **and** config
- App Check: Firebase Console → App Check → register the web app (reCAPTCHA v3/Enterprise); add `initializeAppCheck(...)` in the client init.
- 2FA/passkeys: Firebase Auth multi-factor / WebAuthn — console enable + UI flow.
Both are config + build tasks; not yet implemented.

## 7. Live QA checklist (after 1–3)
- Sign in with Google → onboarding (region/currency) → dashboard.
- Create an **account**, add income/expense assigned to it → balance updates; check Dashboard Accounts card.
- **Transfer** between two same-currency accounts → both balances move; appears in history.
- Create a **subscription** → monthly/annual totals; renewal shows on Calendar; past-due date auto-advances.
- Budget over 90%/100% → notification; savings goal reached → notification; subscription due ≤3d → notification.
- CSV **export** + **import** (preview/dedupe); **global search** (⌘/Ctrl-K); **Install Renew**.
- Switch language/region in Settings → money/dates/nav relocalize; try an RTL language (ar) → layout mirrors.
- Confirm no cross-user data access (Firestore rules) and that OTP email arrives in the account's language.
