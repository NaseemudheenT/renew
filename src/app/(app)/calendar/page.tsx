import { Calendar } from "lucide-react";
import { ComingTogether } from "@/components/ui/ComingTogether";
export const dynamic = "force-dynamic";
export default function Page() {
  return <ComingTogether title="Calendar" icon={Calendar} note="A calm month and day view of your reminders and events arrives next." />;
}
