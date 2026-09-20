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
 *   6 — Leaner still: removed the "what matters most" focus step; richer
 *       Apple-style avatar picker. Name → country → avatar → lock → notify.
 *   7 — "pat3" update: expanded premium avatar set, brand-forward naming.
 *   8 — "pat4" update: real-name fix (profile name everywhere), cleaner phone
 *       top bar, Ren voice reliability, professional (no-emoji) Ren.
 *   9 — "pat5" update: coloured icons, Software Update screen, on-brand focus
 *       (no more stray blue box), swipe sheets.
 *
 * NOTE: "pat6"–"pat11" (restyle, concrete plans, gold + midnight-blue look,
 * light animations, matched light/dark blue themes, Ren in the menu + Siri-style
 * transcript, income nudge) capture no new setup data, so CURRENT_SETUP_VERSION
 * stays at 9 and nobody is sent back through onboarding. Only APP_UPDATE_NAME moves.
 */
export const CURRENT_SETUP_VERSION = 9;

/**
 * The user-facing name for the current software update, Apple-style. Shown in
 * settings/account so people know which release they're on. The launch-era name
 * is "fOS" (Renew Financial OS); future updates step the number up (fOS 2, fOS 3…).
 * (Earlier pre-launch builds were named pat3…pat14.)
 */
export const APP_UPDATE_NAME = "fOS 2";
