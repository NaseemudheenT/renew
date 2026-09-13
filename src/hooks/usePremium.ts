"use client";

import { useUserProfile } from "@/hooks/useUserProfile";
import { isPremium, type Plan } from "@/lib/plan";

/**
 * The signed-in user's plan. `premium` is the single gate the UI checks before
 * offering a Premium-only capability. Server-side authorization is still the
 * real enforcement — this is for the interface only.
 */
export function usePremium(): { plan: Plan; premium: boolean } {
  const { profile } = useUserProfile();
  const plan: Plan = profile?.plan === "premium" ? "premium" : "free";
  return { plan, premium: isPremium(plan) };
}
