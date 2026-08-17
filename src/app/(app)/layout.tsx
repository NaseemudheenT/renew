import { redirect } from "next/navigation";
import { getSessionUser, getUserFlags } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * Authorization boundary for the whole app (preserved foundation). Every private
 * route lives under this group; the session cookie is verified server-side on
 * each request and users are routed to the correct entry step.
 *
 * The old app shell (sidebar/topbar/nav) was removed for the redesign — the new
 * Renew shell will wrap {children} here.
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

  return <>{children}</>;
}
