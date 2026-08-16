import { FileText } from "lucide-react";
import { ComingTogether } from "@/components/ui/ComingTogether";
export const dynamic = "force-dynamic";
export default function Page() {
  return <ComingTogether title="Documents" icon={FileText} note="A secure home for your important documents arrives soon." />;
}
