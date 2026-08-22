import { redirect } from "next/navigation";
import { getSessionUser, getUserFlags } from "@/lib/auth/session";
import { AppShell } from "@/components/shell/AppShell";

export const dynamic = "force-dynamic";

/** Authorization boundary (preserved). Verifies the session, routes to the
 *  correct entry step, then renders the app shell around the page. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  // NOTE: email verification is intentionally NOT a hard gate. Phone-OTP and
  // passkey users have no email (emailVerified === false) — forcing them to an
  // email-verification page would trap them. Phone possession and passkeys are
  // already strong proof; email verification is an optional, later nicety.
  const { onboarded } = await getUserFlags(user.uid);
  if (!onboarded) redirect("/onboarding");

  return (
    <AppShell user={{ uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL }}>
      {children}
    </AppShell>
  );
}
