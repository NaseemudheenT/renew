import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

/** Public, indexable pages (the app itself is behind auth and excluded via robots). */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = publicEnv.appUrl.replace(/\/$/, "");
  const now = new Date();
  const routes = ["", "/sign-up", "/sign-in", "/privacy", "/terms"];
  return routes.map((r) => ({
    url: `${base}${r || "/"}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: r === "" ? 1 : 0.7,
  }));
}
