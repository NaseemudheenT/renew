import { getSessionUser } from "@/lib/auth/session";
import { Dashboard } from "./Dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  const name = user?.displayName?.trim() || "there";
  return <Dashboard name={name} />;
}
