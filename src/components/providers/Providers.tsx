"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "./QueryProvider";
import { AuthProvider } from "./AuthProvider";
import { Toaster } from "@/components/ui/Toaster";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

/** Root client providers. Extended with analytics/consent in later phases. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
        <Toaster />
        <ServiceWorkerRegister />
      </AuthProvider>
    </QueryProvider>
  );
}
