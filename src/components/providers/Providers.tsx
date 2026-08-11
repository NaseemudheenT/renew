"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "./QueryProvider";

/** Root client providers. Extended with analytics/consent in later phases. */
export function Providers({ children }: { children: ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
