"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { QueryProvider } from "./QueryProvider";
import { AuthProvider } from "./AuthProvider";
import { Toaster } from "@/components/ui/Toaster";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

/** Root client providers. Extended with analytics/consent in later phases. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    // reducedMotion="user" makes EVERY Framer animation honour the OS setting:
    // transforms/layout become instant, only opacity remains. One global rule.
    <MotionConfig reducedMotion="user">
      <QueryProvider>
        <AuthProvider>
          {children}
          <Toaster />
          <ServiceWorkerRegister />
        </AuthProvider>
      </QueryProvider>
    </MotionConfig>
  );
}
