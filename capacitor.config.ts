import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Renew — native app configuration (Capacitor).
 *
 * Renew is a server-rendered Next.js app (App Router, API routes, server
 * sessions), so it can't be statically exported into the app bundle. Instead the
 * native shell loads the live, hosted app from getrenew.in and native plugins add
 * device capabilities (biometrics, camera, push, and the Android
 * UPI-notification tracker). `mobile-shell/` is only the cold-start / offline
 * splash.
 *
 * To point at a local dev server while developing, override `server.url` (see
 * MOBILE.md) — never commit a localhost url.
 */
const config: CapacitorConfig = {
  appId: "in.getrenew.app",
  appName: "Renew",
  webDir: "mobile-shell",
  backgroundColor: "#060a18",
  server: {
    url: "https://getrenew.in",
    // The hosted app is HTTPS-only; never allow cleartext.
    cleartext: false,
  },
  ios: {
    contentInset: "always",
    backgroundColor: "#060a18",
  },
  android: {
    backgroundColor: "#060a18",
  },
};

export default config;
