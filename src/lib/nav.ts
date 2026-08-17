import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  PiggyBank,
  TrendingUp,
  ReceiptText,
  Calendar,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Show in the mobile bottom tab bar (space is limited to ~5). */
  primary?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, primary: true },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight, primary: true },
  { href: "/budget", label: "Budget", icon: Target, primary: true },
  { href: "/savings", label: "Savings", icon: PiggyBank, primary: true },
  { href: "/investments", label: "Investments", icon: TrendingUp },
  { href: "/payments", label: "Bills", icon: ReceiptText },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

/** Best-effort page title from a pathname for the top bar. */
export function titleForPath(pathname: string): string {
  const match = NAV_ITEMS.find(
    (i) => pathname === i.href || pathname.startsWith(i.href + "/"),
  );
  return match?.label ?? "Renew";
}
