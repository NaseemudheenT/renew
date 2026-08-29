import { publicEnv } from "@/lib/env";
import type { SessionUser } from "@/lib/auth/session";

/**
 * The owner/host gate. The owner console (users, security, control) is visible
 * to EXACTLY ONE account — the email in NEXT_PUBLIC_OWNER_EMAIL. Everyone else
 * is treated as a normal user and can never see it.
 *
 * The check compares the *verified* session email (minted server-side from a
 * Firebase session cookie), never anything the client can spoof. The env value
 * is only used to know *which* email is the owner — it grants nothing on its own.
 */
export function isOwnerEmail(email: string | null | undefined): boolean {
  const owner = publicEnv.ownerEmail;
  if (!owner) return false; // No owner configured → console is disabled for all.
  if (!email) return false;
  return email.trim().toLowerCase() === owner;
}

/** True when this session belongs to the owner. */
export function isOwner(user: Pick<SessionUser, "email"> | null | undefined): boolean {
  return isOwnerEmail(user?.email);
}
