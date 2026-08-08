# RENEW — Build Checklist

The single source of truth for what's done, in progress, and pending.
Legend: ✅ done & verified · 🔄 in progress · ⬜ pending

---

## Phase 0 — Foundation
- ✅ Next.js 16 + React 19 + TypeScript (strict) + Tailwind v4
- ✅ Design system (gold-on-navy tokens, dark + light, no-flash theme)
- ✅ Integration layer: Firebase (client+admin), Stripe, Cloudinary, Resend, PostHog
- ✅ Providers (theme, query, auth, analytics), metadata, fonts
- ✅ Pushed to GitHub

## Phase 1 — Living Atmosphere + Cinematic Intro
- ✅ Canvas 2D atmosphere (aurora, god-rays, bokeh, particles, parallax) — fallback layer
- ✅ Cinematic overlay (vignette + film grain)
- 🔄 **Lite-3D atmosphere (React Three Fiber)** — real depth, floating motes, soft light orbs, camera parallax, day/night grade
- 🔄 **Cinematic logo intro** — fade-from-dark, logo draws + light sweep, name reveals, tap-to-enter expands into the world
- ⬜ Performance pass: 60fps, reduced-motion fallback, no-WebGL fallback

## Phase 2 — Auth (emerges from the world)
- ✅ Firebase email/password + secure email OTP (HMAC cookie, Resend)
- ✅ Multi-step /login (sign in / create), OTP, resend cooldown
- ⬜ Make login visually "emerge from inside the world" (no page-jump feel)
- ⬜ Terms & Conditions + Privacy Policy acceptance

## Phase 3 — Onboarding (Apple, one question at a time)
- ⬜ Name
- ⬜ Preferred language (localization)
- ⬜ Country + Time zone (auto-detect + confirm)
- ⬜ Avatar — professional preset avatars **and** custom upload (Cloudinary)
- ⬜ Notification permission (real Web Notifications)
- ⬜ Terms acceptance + persist profile to Firestore
- ⬜ Localization: date/time/currency/number formats

## Phase 4 — Immersive Dashboard + Reminders
- ⬜ Creative single-workspace dashboard (panels slide, cards expand, no page jumps)
- ⬜ Add reminder: beautiful category picker (Passport, License, Insurance, Vehicle,
      Warranty, Subscription, Medicine, Bills, Rent, EMI, Membership, Appointments,
      Birthdays, Custom)
- ⬜ Smart schedules per category (auto-suggested reminder timings)
- ⬜ Firestore data model + security rules
- ⬜ Timeline / calendar / search / priority / completion tracking

## Phase 5 — Billing, QA, Deploy
- ⬜ Stripe subscription (₹100/3mo India + localized pricing)
- ⬜ Settings inside the dashboard (theme, profile, notifications)
- ⬜ Empty / loading / error states everywhere
- ⬜ Accessibility (keyboard, focus, reduced-motion, contrast)
- ⬜ Lint clean, type-check clean, no console errors
- ⬜ Deploy to Vercel with env vars

## Cross-cutting quality gates (check every phase)
- ⬜ Works flawlessly in **dark AND light**
- ⬜ 60fps, no jank, no unnecessary JS
- ⬜ No TypeScript / ESLint / console / hydration errors
- ⬜ Real, live, premium — never fake or flashy
- ⬜ Verified in-browser (screenshot) before marking done

---

## Config the user must provide (for production)
- ⬜ Resend: verify a sending domain + set `RESEND_FROM_EMAIL`
- ⬜ Firebase Admin: paste `FIREBASE_SERVICE_ACCOUNT_KEY` (service-account JSON)
- ⬜ Valid `SENTRY_DSN` (the one supplied was invalid)
