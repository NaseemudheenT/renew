import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

/** Let search engines index the public pages; keep the private app out. */
export default function robots(): MetadataRoute.Robots {
  const base = publicEnv.appUrl.replace(/\/$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard", "/transactions", "/accounts", "/budget", "/savings",
        "/payments", "/analytics", "/income", "/settings", "/account",
        "/import", "/quick-add", "/onboarding", "/api/",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
