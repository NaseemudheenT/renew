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
export const APP_UPDATE_NAME = "fOS 4";

/**
 * A stable key for the current update, used to show the "What's New" reveal once
 * per release (stored in localStorage). Bump it whenever WHATS_NEW changes so
 * every user sees the highlights the next time they open Renew.
 */
export const APP_UPDATE_KEY = "fos-4";

/** Lucide icon name (mapped in WhatsNew) for each highlight. */
export interface UpdateHighlight { icon: string; title: string; desc: string }

/**
 * What's new in this release — shown once, Apple-style, to every user on their
 * first open after the update. Kept short and human.
 */
export const WHATS_NEW: UpdateHighlight[] = [
  { icon: "Sparkles", title: "A logo made of light", desc: "Your new cinematic opening — the RENEW mark drawn in real time." },
  { icon: "Gem", title: "Liquid-glass everywhere", desc: "Every card and menu now catches soft, moving light with real depth." },
  { icon: "Palette", title: "Colour-coded money", desc: "Each category has its own colour across transactions, budgets and analysis." },
  { icon: "Bot", title: "Ren can do things", desc: "Ask Ren to switch the theme, open any screen, or log money — just say it." },
  { icon: "Zap", title: "Faster & smoother", desc: "3D tilt, gentle parallax and instant, calm loading — no spinners." },
];
