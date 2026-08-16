import { getSessionUser } from "@/lib/auth/session";
import { Dashboard } from "./Dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  const firstName = (user?.displayName ?? "there").split(" ")[0] || "there";
  return <Dashboard firstName={firstName} />;
}
