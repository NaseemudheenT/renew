import {
  LayoutDashboard,
  Bell,
  Calendar,
  ListTodo,
  FileText,
  Wallet,
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
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, primary: true },
  { href: "/reminders", label: "Reminders", icon: Bell, primary: true },
  { href: "/calendar", label: "Calendar", icon: Calendar, primary: true },
  { href: "/tasks", label: "Tasks", icon: ListTodo, primary: true },
  { href: "/payments", label: "Payments", icon: Wallet },
  { href: "/documents", label: "Documents", icon: FileText },
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
