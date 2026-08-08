"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Atmosphere } from "@/components/atmosphere/live-atmosphere";
import { RenewMark } from "@/components/brand/renew-mark";
import { Wordmark } from "@/components/brand/wordmark";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/components/providers/auth-provider";

/**
 * Placeholder onboarding — the full one-question-at-a-time flow is Phase 3.
 * Guards access: unauthenticated visitors are sent back to /login.
 */
export default function OnboardingPage() {
  const router = useRouter();
  const { user, initializing, logout } = useAuth();

  useEffect(() => {
    if (!initializing && !user) router.replace("/login");
  }, [initializing, user, router]);

  if (initializing || !user) {
    return (
      <main className="relative flex min-h-dvh items-center justify-center">
        <Atmosphere />
        <RenewMark size={64} glow />
      </main>
    );
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Atmosphere />
      <div className="fixed top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center"
      >
        <RenewMark size={80} glow />
        <Wordmark as="h1" className="mt-6 text-3xl" />
        <p className="mt-4 max-w-sm text-sm text-[var(--muted)]">
          You&apos;re verified, {user.email}. The full onboarding experience arrives in Phase 3.
        </p>
        <div className="mt-8 flex gap-3">
          <Button variant="outline" size="md" onClick={() => logout()}>
            Sign out
          </Button>
        </div>
      </motion.div>
    </main>
  );
}
