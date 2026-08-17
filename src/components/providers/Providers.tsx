"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { QueryProvider } from "./QueryProvider";
import { AuthProvider } from "./AuthProvider";
import { LocaleProvider } from "./LocaleProvider";
import { Toaster } from "@/components/ui/Toaster";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

/** Root client providers. reducedMotion="user" makes every animation honour the OS setting. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
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
