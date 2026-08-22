"use client";

import { createBrowserClient } from "@supabase/ssr";
import { publicEnv, hasSupabaseConfig } from "@/lib/env";

/**
 * Supabase BROWSER client (@supabase/ssr). Additive alongside Firebase — Renew
 * intentionally runs both: Firebase for existing auth/data, Supabase (Postgres)
 * for future relational data. Only the publishable (RLS-protected) key reaches
 * the browser; the service-role key never does.
 *
 * Created lazily so a missing config never crashes prerender/build.
 */
export function getSupabaseBrowserClient() {
  if (!hasSupabaseConfig()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  return createBrowserClient(
    publicEnv.supabase.url,
    publicEnv.supabase.publishableKey,
  );
}
