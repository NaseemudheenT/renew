"use client";

import { ThemeProvider } from "./theme-provider";
import { QueryProvider } from "./query-provider";
import { PostHogProvider } from "./posthog-provider";
import { AuthProvider } from "./auth-provider";

/**
 * Single composition point for all client-side providers. Order matters:
 * Theme (outermost) → Query (data) → Auth (session) → PostHog (analytics).
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <PostHogProvider>{children}</PostHogProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
