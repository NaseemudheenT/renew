import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

/**
 * PWA manifest. Renew is installable on Android/desktop Chromium and iOS.
 * PNG icons at 192/512 satisfy the Android install prompt; a full-bleed 512 is
 * declared maskable so it adapts to platform icon masks, with the SVG offered as
 * a scalable "any". We do NOT claim full offline capability — the service worker
 * provides a basic shell cache and an offline fallback only (see public/sw.js).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND.name,
    short_name: BRAND.name,
    description:
      "A calm, premium personal finance companion — track balances, transactions, budgets, savings, investments and bills in one place.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b1220",
    theme_color: "#0b1220",
    categories: ["productivity", "lifestyle", "utilities", "finance"],
    // Long-press the app icon for instant actions (Android/desktop Chromium).
    shortcuts: [
      { name: "Add expense or income", short_name: "Add", url: "/quick-add", icons: [{ src: BRAND.icons.icon192, sizes: "192x192", type: "image/png" }] },
      { name: "Scan a receipt", short_name: "Scan", url: "/import?scan=1", icons: [{ src: BRAND.icons.icon192, sizes: "192x192", type: "image/png" }] },
      { name: "Ask Ren", short_name: "Ren", url: "/dashboard?ren=1", icons: [{ src: BRAND.icons.icon192, sizes: "192x192", type: "image/png" }] },
      { name: "Analytics", short_name: "Analytics", url: "/analytics", icons: [{ src: BRAND.icons.icon192, sizes: "192x192", type: "image/png" }] },
    ],
    icons: [
      { src: BRAND.icons.icon192, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: BRAND.icons.icon512, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: BRAND.icons.maskable, sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: BRAND.icons.svg, sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
