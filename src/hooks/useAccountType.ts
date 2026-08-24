"use client";

import { useUserProfile, type AccountType } from "./useUserProfile";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";

/**
 * The person's active Renew workspace. `isBusiness` follows the live
 * Personal/Business switch (not a stored preference) so labels flip with the
 * workspace — e.g. "Revenue / Expenses" instead of "In / Out". It NEVER hides
 * money. `accountType` is their onboarding/primary choice, kept for settings.
 */
export function useAccountType(): {
  accountType: AccountType;
  isBusiness: boolean;
  loading: boolean;
} {
  const { profile, loading } = useUserProfile();
  const { mode } = useWorkspace();
  return {
    accountType: profile?.accountType ?? "personal",
    isBusiness: mode === "business",
    loading,
  };
}
