"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "./QueryProvider";
import { AuthProvider } from "./AuthProvider";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

/**
 * Root client providers (preserved foundation): data-fetching, auth state, and
 * the PWA service worker. UI-specific providers (toaster, motion config) were
 * removed with the old UI and will be re-introduced by the new design.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
        <ServiceWorkerRegister />
      </AuthProvider>
    </QueryProvider>
  );
}
