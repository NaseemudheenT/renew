/**
 * The current Renew setup ("full setup") version.
 *
 * Bumping this forces EVERY existing user back through the full onboarding/setup
 * flow on their next visit — used when the setup captures new required things
 * (e.g. the upgraded passwordless + app-lock + legal-consent setup). A user whose
 * profile has `setupVersion === CURRENT_SETUP_VERSION` is fully set up; anyone
 * missing it (old accounts) or on an older version is routed to /onboarding.
 *
 * History:
 *   1 — original onboarding
 *   2 — fully-upgraded setup (premium passwordless, app-lock/passcode, legal
 *       consent, region/currency, avatar).
 *   3 — country is now a DELIBERATE choice (no silent auto-detect); everyone
 *       re-confirms it so currency/formatting are correct.
 *   4 — Apple-style setup: captures an optional monthly-income baseline (so
 *       advice works from day one) and sets up the iPhone-style app-lock
 *       passcode + Face ID during onboarding. Everyone runs it once.
 *   5 — Simpler, honest setup: removed the income question; the app-lock is now
 *       MANDATORY (a 4-digit Apple-style passcode or Face ID only). Everyone
 *       runs it once so every account is protected.
 */
export const CURRENT_SETUP_VERSION = 5;
