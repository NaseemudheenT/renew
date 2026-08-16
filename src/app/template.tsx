"use client";

import { PageTransition } from "@/components/motion";

/**
 * Next re-mounts this template on every navigation, so wrapping children here
 * gives each route a cinematic enter transition without any per-page wiring.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
