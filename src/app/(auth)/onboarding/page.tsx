import { redirect } from "next/navigation";
import { getSessionUser, getUserFlags } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * Onboarding route. Server guards (preserved foundation) are intact; the old
 * onboarding UI was removed for the redesign and will be rebuilt here.
 */
export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  if (!user.emailVerified) redirect("/verify");
  const { onboarded } = await getUserFlags(user.uid);
  if (onboarded) redirect("/dashboard");
  return null;
}
