"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { QueryProvider } from "./QueryProvider";
import { AuthProvider } from "./AuthProvider";
import { LocaleProvider } from "./LocaleProvider";
import { Toaster } from "@/components/ui/Toaster";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { subscribeA11y, getReduceMotion } from "@/lib/a11y";

/**
 * Root client providers. Motion honours BOTH the OS "reduce motion" setting and
 * Renew's own Accessibility toggle: when the in-app toggle is on we force
 * `reducedMotion="always"`, otherwise we defer to the OS ("user").
 */
export function Providers({ children }: { children: ReactNode }) {
  const a11yReduced = useSyncExternalStore(subscribeA11y, getReduceMotion, () => false);
  return (
    <MotionConfig reducedMotion={a11yReduced ? "always" : "user"}>
      <QueryProvider>
        <AuthProvider>
          <LocaleProvider>
            {children}
            <Toaster />
            <ServiceWorkerRegister />
          </LocaleProvider>
        </AuthProvider>
      </QueryProvider>
    </MotionConfig>
  );
}
