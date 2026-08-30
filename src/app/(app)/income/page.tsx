import { redirect } from "next/navigation";

// Income & Expense now live on the single Transactions ledger (filter by type),
// with the income breakdowns shown on Analytics. One money surface, no duplicate.
export default function IncomePage() {
  redirect("/transactions");
}
