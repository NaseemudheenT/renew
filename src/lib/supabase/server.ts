import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv, hasSupabaseConfig } from "@/lib/env";

/**
 * Supabase SERVER client (@supabase/ssr) — the current, non-deprecated pattern
 * (NOT @supabase/auth-helpers-nextjs). Reads/writes the request cookies so any
 * Supabase session stays in sync across SSR. Additive: Firebase auth is
 * unchanged and remains Renew's authentication system.
 *
 * Uses the publishable key so Row-Level Security is enforced. A service-role
 * client (bypassing RLS) is added separately, server-only, when needed.
 */
export async function getSupabaseServerClient() {
  if (!hasSupabaseConfig()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  const cookieStore = await cookies();
  return createServerClient(
    publicEnv.supabase.url,
    publicEnv.supabase.publishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component (read-only cookies) — safe to
            // ignore; session refresh happens on server actions / route handlers.
          }
        },
      },
    },
  );
}
