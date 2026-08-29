import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { QuickAddView } from "./QuickAddView";

export const dynamic = "force-dynamic";

/**
 * Standalone one-shot capture — opens straight into the amount keypad, no nav,
 * no dashboard. This is the URL a Back Tap / Siri Shortcut or a home-screen
 * shortcut points at. Saving is one tap; then you're done.
 */
export default async function QuickAddPage() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in?next=/quick-add");
  return <QuickAddView />;
}
