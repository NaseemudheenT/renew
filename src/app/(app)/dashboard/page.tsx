import { getSessionUser } from "@/lib/auth/session";
import { DashboardGreeting } from "./DashboardGreeting";

export const dynamic = "force-dynamic";

/**
 * Placeholder dashboard — proves the full entry flow terminates on real,
 * authenticated user state. Part 3 replaces this with the app shell + live
 * dashboard.
 */
export default async function DashboardPage() {
  const user = await getSessionUser();
  const firstName = (user?.displayName ?? "there").split(" ")[0] || "there";

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-6 p-6 text-center">
      <DashboardGreeting firstName={firstName} />
    </main>
  );
}
