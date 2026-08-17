import { redirect } from "next/navigation";
import { getSessionUser, getUserFlags } from "@/lib/auth/session";
import { AppShell } from "@/components/shell/AppShell";

export const dynamic = "force-dynamic";

/** Authorization boundary (preserved). Verifies the session, routes to the
 *  correct entry step, then renders the app shell around the page. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  if (!user.emailVerified) redirect("/verify");
  const { onboarded } = await getUserFlags(user.uid);
  if (!onboarded) redirect("/onboarding");

  return (
    <AppShell user={{ uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL }}>
      {children}
    </AppShell>
  );
}
