import { redirect } from "next/navigation";
import { getSessionUser, getUserFlags } from "@/lib/auth/session";
import { OnboardingClient } from "./OnboardingClient";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  // No email-verification gate — phone/passkey users have no email to verify.
  // Only skip setup for users who are onboarded AND on the current setup version.
  const { onboarded, setupCurrent } = await getUserFlags(user.uid);
  if (onboarded && setupCurrent) redirect("/dashboard");

  return <OnboardingClient uid={user.uid} defaultName={user.displayName ?? ""} />;
}
