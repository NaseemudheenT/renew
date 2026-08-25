import { redirect } from "next/navigation";

// Calendar now lives alongside Analysis on the Insights page (/analytics).
export default function CalendarPage() {
  redirect("/analytics");
}
