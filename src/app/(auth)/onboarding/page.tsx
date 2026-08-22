import { redirect } from "next/navigation";
import { getSessionUser, getUserFlags } from "@/lib/auth/session";
import { OnboardingClient } from "./OnboardingClient";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  // No email-verification gate — phone/passkey users have no email to verify.
  const { onboarded } = await getUserFlags(user.uid);
  if (onboarded) redirect("/dashboard");

  return <OnboardingClient defaultName={user.displayName ?? ""} />;
}
