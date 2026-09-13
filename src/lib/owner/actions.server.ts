import "server-only";

import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

/**
 * Owner admin actions. Server-only; the route MUST confirm the caller is the
 * owner before invoking these. Every action here is account/access/plan control
 * — NEVER anything that touches or exposes a user's money (the hard privacy
 * rule). All are reversible.
 */
export type OwnerAction = "disable" | "enable" | "grantPremium" | "revokePremium" | "signout";

export async function runOwnerAction(targetUid: string, action: OwnerAction): Promise<void> {
  const auth = getAdminAuth();
  const db = getAdminDb();
  switch (action) {
    case "disable":
      // Block sign-in and end any live sessions.
      await auth.updateUser(targetUid, { disabled: true });
      await auth.revokeRefreshTokens(targetUid);
      break;
    case "enable":
      await auth.updateUser(targetUid, { disabled: false });
      break;
    case "grantPremium":
      await db.collection("users").doc(targetUid).set({ plan: "premium", planSince: Date.now() }, { merge: true });
      break;
    case "revokePremium":
      await db.collection("users").doc(targetUid).set({ plan: "free" }, { merge: true });
      break;
    case "signout":
      // Force re-login everywhere (revokes refresh tokens).
      await auth.revokeRefreshTokens(targetUid);
      break;
  }
}
