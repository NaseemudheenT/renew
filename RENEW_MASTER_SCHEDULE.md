# RENEW — Master Schedule

Source of truth = the original Renew build brief. Kept updated as work proceeds.

**Legend:** ✅ Done (built + statically verified: typecheck/lint/build/unit tests) · 🟡 Partial · ⬜ Not done · 🔧 Needs fix · 🔒 Owner-blocked (needs your credentials/deploy)

> **"Done" = code-complete and statically verified.** Live end-to-end verification against Firebase and production deployment are 🔒 — this worktree has no `.env.local`, so runtime persistence, Vercel deploy, Apple provider config, and live QA are owner actions.

---

## Phase 0 — Infra & repo
- ✅ GitHub repo, branch/worktree flow, main-sync flow
- ✅ Stack: Next 16 · React 19 · TS strict · Tailwind v4 · Framer Motion · Firebase · Zustand · React Query
- 🔒 `.env.local` secrets (present in run folder; absent in worktree — used, never printed/committed)

## Phase 1 — Auth & session
- ✅ Google sign-in (client) · httpOnly session cookies (Admin) · `proxy.ts` gate · `(app)` server guard · persistence · logout · protected routes
- 🔒 Apple sign-in (needs Firebase provider config: Services ID, Team ID, Key ID, .p8, return URL)
- 🟡 Email/OTP fallback (infra preserved; not primary)
- 🔒 Live auth flow QA

## Phase 2 — Onboarding
- ✅ Welcome · name · region/language/currency/week-start step · focus areas · skip · edit-later in Settings · server-validated (Zod)

## Phase 3 — Design system & motion
- ✅ Liquid-glass tokens + real `liquid-glass.tsx` (GlassSurface/GlassButton) · GlassFilter refraction
- ✅ WebGL champagne background (RenewBackground) · reduced-motion fallback
- ✅ Motion primitives · page transitions · cinematic intro/landing
- ✅ `CreditCardForm` component (Renew glass)
- 🟡 Horizon-style hero (cinematic landing exists; not the specific Horizon component)

## Phase 4 — Internationalization
- ✅ config/format/messages/LocaleProvider · region→currency (India never default) · RTL `<html dir>`
- ✅ Presentation everywhere: money, numbers, dates, week-start, nav, page titles, calendar, tx grouping
- ✅ Settings → Region & Language · localized generated notifications
- 🟡 Message-catalog breadth (en full; es/fr/de extended to new domains; hi/ar partial → English fallback; hi/ar left partial to avoid low-confidence machine translations)
- ✅ Resend OTP email localized (en/es/fr/de) from the user's saved locale
- ✅ RTL logical-property pass across shared primitives AND all finance screens/rows; 🟡 device visual QA still recommended

## Phase 5 — Finance core
- ✅ Dashboard · Transactions (CRUD/search/filter/group/undo/account/custom categories) · Categories + custom
- ✅ Budgets (currency-correct) · Savings · Investments · Bills · Calendar · Analytics · Global search
- ✅ Accounts (types, derived balances, archive/restore, safe delete) — *branch, pending rules deploy*
- ✅ Transfers (same-currency, validated, not income/expense) — *branch, pending rules deploy*
- ✅ Subscriptions (monthly/annual totals, renewals) — *branch, pending rules deploy*
- 🟡 Multi-currency aggregation (per-item correct; cross-currency headline totals deferred — needs rates/product decision)

## Phase 6 — Notifications
- ✅ Bills/reminders/tasks/documents · budget warning+exceeded · savings milestone · subscription renewal
- ✅ In-app center · bell · read/unread · mark-all · prefs · dedupe (idempotent ids)
- ✅ Browser notifications (local, permission-gated, tab-backgrounded; SW click-to-open) — true server push still needs FCM 🔒
- ⬜ email notifications (beyond OTP)

## Phase 7 — Settings & data
- ✅ Profile · appearance/theme · region · notification prefs · categories management
- ✅ Data export (JSON/CSV) · CSV import (parse/preview/dedupe) · sign out · delete account
- 🟡 Billing (Free plan useful; "add payment method" UI provider-safe; Stripe checkout not wired)

## Phase 8 — Security
- ✅ Per-user isolation · Firestore rules (owner-only allowlist) · server + client validation · safe errors · no client secrets
- 🔒 Rules deploy for accounts/transfers/subscriptions (diff handed off)
- ⬜ App Check · 2FA/passkeys (Firebase config)

## Phase 9 — PWA / responsive / a11y / performance
- ✅ Manifest · service worker · offline · Install Renew affordance
- ✅ Responsive layouts · accessible dialogs (modal + search focus trap/scroll-lock) · reduced-motion
- 🟡 Formal performance audit (no dup listeners / lazy already in place)

## Phase 10 — Billing / payments
- ✅ Free tier genuinely useful · payment-card UI
- 🔒 Stripe checkout + webhooks (needs live keys + endpoints) · ⬜ premium features

## Phase 11 — Testing
- ✅ 82 unit tests (finance, i18n, export, import, accounts, notifications) · production build test
- ⬜ E2E/workflow tests · 🔒 live-Firebase persistence QA

## Phase 12 — Deployment & monitoring
- ✅ GitHub main sync (except the 3 new domains, held pending your rules deploy)
- 🔒 Vercel deploy · 🔒 Firestore rules deploy (commands handed off) · 🟡 Sentry (configured; verify in prod)

---

### Accounts / Transfers / Subscriptions — status
- ✅ Built, unit-tested, **self-reviewed + fixed** (5 findings).
- ✅ Integrated: Dashboard (account balances card), Calendar (renewals), Analytics
  (recurring cost), Data export, Global search, Notifications (renewals).
- ✅ Transactions can be attributed to an account (currency locked to it).
- ✅ Subscriptions auto-advance past-due billing dates.
- 🔒 **Blocked on you:** deploy the `firestore.rules` diff (handed off), then these
  persist live. Until then reads/writes to accounts/transfers/subscriptions
  return `permission-denied`.

### Remaining work (mostly owner-gated)
- 🔒 Deploy Firestore rules · Vercel deploy · Apple sign-in · Stripe checkout · live QA
- 🟡 Deferred by you: multi-currency headline aggregation (net worth incl. opening
  balances) — keep current behavior, decide with rates/product later
- 🟡/⬜ Lower-value: message-catalog breadth, Resend email localization, deep RTL
  device polish, browser-push pipeline, formal perf audit, E2E tests
- 🔒 Merge the branch to `main` after you deploy the rules (I've held it)
