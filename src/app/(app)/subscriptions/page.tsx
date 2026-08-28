import { redirect } from "next/navigation";

// Subscriptions now live alongside Bills on the Bills page (/payments).
export default function SubscriptionsPage() {
  redirect("/payments");
}
