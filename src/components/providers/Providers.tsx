"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { QueryProvider } from "./QueryProvider";
import { AuthProvider } from "./AuthProvider";
import { Toaster } from "@/components/ui/Toaster";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

/** Root client providers. reducedMotion="user" makes every animation honour the OS setting. */
export function Providers({ children }: { children: ReactNode }) {
  return (
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
