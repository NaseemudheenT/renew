import { Settings } from "lucide-react";
import { ComingTogether } from "@/components/ui/ComingTogether";
export const dynamic = "force-dynamic";
export default function Page() {
  return <ComingTogether title="Settings" icon={Settings} note="Profile, appearance, notifications, security and billing arrive soon." />;
}
