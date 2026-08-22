import type { MetadataRoute } from "next";

/**
 * PWA manifest. Renew is installable on Android/desktop Chromium and iOS.
 * PNG icons at 192/512 satisfy the Android install prompt; a full-bleed 512 is
 * declared maskable so it adapts to platform icon masks, with the SVG offered as
 * a scalable "any". We do NOT claim full offline capability — the service worker
 * provides a basic shell cache and an offline fallback only (see public/sw.js).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Renew",
    short_name: "Renew",
    description:
      "A calm, premium personal finance companion — track balances, transactions, budgets, savings, investments and bills in one place.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#060a18",
    theme_color: "#060a18",
    categories: ["productivity", "lifestyle", "utilities"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
