"use client";

import { useUserProfile, type AccountType } from "./useUserProfile";

/**
 * The person's Renew mode. Defaults to "personal" until they choose otherwise.
 * `isBusiness` is true for business or both — used to shape labels (e.g.
 * "Revenue / Expenses" instead of "In / Out"). It NEVER hides money.
 */
export function useAccountType(): {
  accountType: AccountType;
  isBusiness: boolean;
  loading: boolean;
} {
  const { profile, loading } = useUserProfile();
  const accountType = profile?.accountType ?? "personal";
  return {
    accountType,
    isBusiness: accountType === "business" || accountType === "both",
    loading,
  };
}
