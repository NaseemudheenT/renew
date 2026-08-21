# Renew

A calm, premium money companion — see what you have, where it's going, and
what's coming next. Accounts, transactions, budgets, savings, bills and
subscriptions in one private place. By Zap.

### ▶ View the live app

**→ https://renew-clientflownn.vercel.app**

The working product runs on Vercel (a Next.js server app — real login, sessions
and APIs, which is why it can't run on static GitHub Pages). Every push to
`main` deploys automatically.

### ▶ Or run it straight from GitHub

Click **Code → Codespaces → Create codespace on main** (or open
[codespaces.new/NaseemudheenT/renew](https://codespaces.new/NaseemudheenT/renew)).
It builds the whole project in your browser — no Mac needed. Add your keys as
Codespace secrets (see `.env.example`), then run `npm run dev`.

---

Next 16 · React 19 · Tailwind v4 · Framer Motion · Firebase (Auth + Firestore) ·
Cloudinary · Resend · Stripe.

## Run locally

```bash
cp .env.example .env.local   # fill in your keys
npm install
npm run dev
```

Then open http://localhost:3000.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run typecheck` — TypeScript, no emit
- `npm run lint` — ESLint (zero-warnings policy)

## Security — deploy the Firestore rules

All user data lives under `users/{uid}/…` and is protected by
[`firestore.rules`](./firestore.rules), which allows a signed-in user to read
and write only their own documents. **These rules must be deployed** for
authorization to be enforced in production:

```bash
firebase deploy --only firestore:rules
```

Server-only secrets (Firebase Admin, Cloudinary, Resend, Stripe) are read via
`src/lib/env.ts` behind `server-only` guards and are never sent to the browser.
Session cookies are httpOnly, `Secure` in production, and verified server-side
with the Firebase Admin SDK on every private request.

## Architecture

- **Auth** — Firebase email/password + Google; httpOnly session cookies minted
  via the Admin SDK; custom email OTP (Resend) for verification. Private routes
  live under `src/app/(app)` and are guarded server-side; `src/proxy.ts` adds an
  optimistic edge redirect.
- **Data** — realtime Firestore under `users/{uid}/{reminders|tasks|documents|payments|notifications}`,
  read through the `useUserCollection` hook.
- **Files** — signed, per-user direct-to-Cloudinary uploads.
- **Motion** — a shared motion language in `src/lib/motion.ts` and
  `src/components/motion`, globally reduced-motion aware.
