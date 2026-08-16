import { Wallet } from "lucide-react";
import { ComingTogether } from "@/components/ui/ComingTogether";
export const dynamic = "force-dynamic";
export default function Page() {
  return <ComingTogether title="Payments" icon={Wallet} note="Track important payments and never miss a due date — arriving soon." />;
}
