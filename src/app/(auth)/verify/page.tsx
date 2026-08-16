import { redirect } from "next/navigation";
import { getSessionUser, getUserFlags } from "@/lib/auth/session";
import { VerifyClient } from "./VerifyClient";

export const dynamic = "force-dynamic";

export default async function VerifyPage() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  if (user.emailVerified) {
    const { onboarded } = await getUserFlags(user.uid);
    redirect(onboarded ? "/dashboard" : "/onboarding");
  }
  return <VerifyClient email={user.email ?? ""} />;
}
