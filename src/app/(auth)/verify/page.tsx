import { redirect } from "next/navigation";
import { getSessionUser, getUserFlags } from "@/lib/auth/session";
import { VerifyClient } from "./VerifyClient";

export const dynamic = "force-dynamic";

export default async function VerifyPage() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  if (user.emailVerified) {
    const { onboarded, setupCurrent } = await getUserFlags(user.uid);
    redirect(onboarded && setupCurrent ? "/dashboard" : "/onboarding");
  }
  return <VerifyClient email={user.email ?? ""} />;
}
