import type { MetadataRoute } from "next";

/**
 * Web App Manifest — makes Renew installable as a desktop / mobile app.
 * Served by Next at /manifest.webmanifest (auto-linked in <head>).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Renew — Never forget what matters",
    short_name: "Renew",
    description:
      "A calm, premium companion so you never lose money, documents, or peace of mind because you forgot something important.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait-primary",
    background_color: "#0b0e14",
    theme_color: "#0b0e14",
    categories: ["productivity", "lifestyle", "utilities"],
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
