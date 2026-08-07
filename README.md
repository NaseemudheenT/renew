<div align="center">

# RENEW

**A calm, premium life companion — so you never lose money, opportunities, documents, or peace of mind because you forgot something important.**

By **Zap** · Built with Next.js 16 · TypeScript · Tailwind v4 · Firebase · Stripe

</div>

---

## What Renew is

Renew is not another reminder app. It is a beautiful, effortless, trustworthy experience for remembering life's important commitments — passports, insurance, renewals, bills, subscriptions, appointments — presented inside one calm, cinematic workspace.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, RSC) + React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 (CSS-config) + design tokens |
| Motion | Framer Motion + React Three Fiber (subtle depth) |
| Auth / Data | Firebase Auth, Firestore, Storage (+ Admin SDK server-side) |
| Payments | Stripe (localized pricing) |
| Media | Cloudinary (signed uploads) |
| Email | Resend (OTP, digests) |
| Analytics / Errors | PostHog · Sentry |
| Forms | React Hook Form + Zod |
| Data fetching / State | TanStack Query · Zustand |

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in real values (never commit .env.local)
npm run dev                  # http://localhost:3000
```

## Project structure

```
src/
  app/            # routes (App Router)
  components/     # UI + providers
  lib/            # integrations (firebase, stripe, cloudinary, resend, posthog) + utils
```

## Environment

All secrets live in `.env.local` (gitignored). See `.env.example` for the full list.
`NEXT_PUBLIC_*` values are exposed to the browser by design; everything else is server-only.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

---

© Zap. All rights reserved.
