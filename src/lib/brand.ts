/**
 * RENEW — the canonical brand source of truth (design spec §79).
 *
 * Every logo/icon path and brand string lives here ONCE. Components, metadata
 * and the PWA manifest consume this module instead of hard-coding paths, so the
 * brand can be refreshed in a single place and can never drift apart.
 *
 * Asset notes:
 *  - `logo` is the founder's official gold Renew logo on its dark tile. It is
 *    used ONLY where a boxed app-icon is correct (app icon, favicon, OG).
 *  - Inside the app we render the bare, theme-aware vector mark + wordmark
 *    (`components/brand/RenewMark` + `Wordmark`) so the dark tile never shows
 *    as a box on the light theme.
 */

export const BRAND = {
  name: "Renew",
  /** Parent company, shown in legal/footers where relevant. */
  parent: "Zap",
  domain: "https://getrenew.in",
  /** The official logo raster (gold mark + RENEW wordmark on the dark tile). */
  logo: "/renew-logo.png",
  icons: {
    favicon32: "/favicon-32.png",
    icon192: "/icon-192.png",
    icon512: "/icon-512.png",
    maskable: "/icon-maskable.png",
    appleTouch: "/apple-touch-icon.png",
    svg: "/icon.svg",
  },
  /** 1200x630 social preview. */
  ogImage: "/og-image.png",
} as const;

export type Brand = typeof BRAND;
