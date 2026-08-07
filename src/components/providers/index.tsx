"use client";

import { ThemeProvider } from "./theme-provider";
import { QueryProvider } from "./query-provider";
import { PostHogProvider } from "./posthog-provider";

/**
 * Single composition point for all client-side providers. Order matters:
 * Theme (outermost, affects everything) → Query (data) → PostHog (analytics).
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <PostHogProvider>{children}</PostHogProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
