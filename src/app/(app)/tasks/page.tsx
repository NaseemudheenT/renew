import { ListTodo } from "lucide-react";
import { ComingTogether } from "@/components/ui/ComingTogether";
export const dynamic = "force-dynamic";
export default function Page() {
  return <ComingTogether title="Tasks" icon={ListTodo} note="Quick, satisfying task capture and completion arrives soon." />;
}
