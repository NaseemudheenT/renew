"use client";

import { ThemeProvider } from "./theme-provider";
import { QueryProvider } from "./query-provider";
import { PostHogProvider } from "./posthog-provider";
import { AuthProvider } from "./auth-provider";
import { PwaManager } from "@/components/pwa/install";

/**
 * Single composition point for all client-side providers. Order matters:
 * Theme (outermost) → Query (data) → Auth (session) → PostHog → PWA.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <PostHogProvider>
            <PwaManager>{children}</PwaManager>
          </PostHogProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
