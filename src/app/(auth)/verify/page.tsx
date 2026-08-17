import { redirect } from "next/navigation";
import { getSessionUser, getUserFlags } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * OTP verification route. Server guards (preserved foundation) are intact; the
 * old verification UI was removed for the redesign and will be rebuilt here.
 */
export default async function VerifyPage() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  if (user.emailVerified) {
    const { onboarded } = await getUserFlags(user.uid);
    redirect(onboarded ? "/dashboard" : "/onboarding");
  }
  return null;
}
