import type { MetadataRoute } from "next";

/**
 * PWA manifest. Renew is installable on Android/desktop Chromium and iOS.
 * The SVG icon is declared "any maskable" so it adapts to platform icon masks.
 * We do NOT claim full offline capability — the service worker provides a basic
 * shell cache and an offline fallback only (see public/sw.js).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Renew — Your money, beautifully clear",
    short_name: "Renew",
    description:
      "A calm, premium personal finance companion — track balances, transactions, budgets, savings, investments and bills in one place.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#17130a",
    theme_color: "#17130a",
    categories: ["productivity", "lifestyle", "utilities"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
