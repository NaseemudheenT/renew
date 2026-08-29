import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { isOwner } from "@/lib/auth/owner";
import { OwnerConsole } from "./OwnerConsole";

export const dynamic = "force-dynamic";

/**
 * The owner/host console. Server-side gate: only the single owner email reaches
 * this page — everyone else is quietly sent to their dashboard, so the route
 * never even hints it exists.
 */
export default async function OwnerPage() {
  const user = await getSessionUser();
  if (!user || !isOwner(user)) redirect("/dashboard");
  return <OwnerConsole />;
}
