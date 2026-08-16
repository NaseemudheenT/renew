import { Bell } from "lucide-react";
import { ComingTogether } from "@/components/ui/ComingTogether";
export const dynamic = "force-dynamic";
export default function Page() {
  return <ComingTogether title="Reminders" icon={Bell} note="Fast reminder creation, repeats and completion arrive in the next build part." />;
}
