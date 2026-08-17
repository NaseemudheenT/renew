"use client";

import { PageTransition } from "@/components/motion";

/** Next re-mounts this on every navigation, giving each route a cinematic enter. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
