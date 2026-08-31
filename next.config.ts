import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Ship less JS: import only the icons/helpers actually used from these big
  // barrel packages, instead of their whole module graphs.
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "date-fns"],
  },
  // Hide the Next.js dev-only on-screen indicator (the "N" devtools badge) so
  // it doesn't overlap the product preview. This only affects `next dev`; the
  // indicator is never present in `next build` / production regardless.
  devIndicators: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            // Allow the site's OWN origin to use the camera (QR scanning,
            // receipt capture) and the microphone (Ren's voice + voice-add);
            // deny both to third parties. Geolocation stays fully off.
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), geolocation=()",
          },
          // Force HTTPS for two years (incl. subdomains) — bank-grade transport
          // security for a money app. Applies only over HTTPS (Vercel).
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
