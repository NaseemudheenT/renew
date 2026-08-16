import { redirect } from "next/navigation";
import { getSessionUser, getUserFlags } from "@/lib/auth/session";
import { AppShell } from "@/components/shell/AppShell";

export const dynamic = "force-dynamic";

/**
 * The authorization boundary for the whole app. Every private route lives under
 * this group. We verify the session cookie server-side (admin SDK) on each
 * request, route users to the correct step of the entry flow, then render the
 * persistent app shell around the page.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  if (!user.emailVerified) redirect("/verify");
  const { onboarded } = await getUserFlags(user.uid);
  if (!onboarded) redirect("/onboarding");

  return (
    <AppShell
      user={{
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      }}
    >
      {children}
    </AppShell>
  );
}
