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
import type { MessageKey } from "@/lib/i18n/messages";

export interface NavItem {
  href: string;
  /** English fallback label (used when a translation is missing). */
  label: string;
  /** i18n message key for the localized label. */
  msgKey: MessageKey;
  icon: LucideIcon;
  /** Show in the mobile bottom tab bar (space is limited to ~5). */
  primary?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", msgKey: "nav.dashboard", icon: LayoutDashboard, primary: true },
  { href: "/transactions", label: "Transactions", msgKey: "nav.transactions", icon: ArrowLeftRight, primary: true },
  { href: "/budget", label: "Budget", msgKey: "nav.budget", icon: Target, primary: true },
  { href: "/savings", label: "Savings", msgKey: "nav.savings", icon: PiggyBank, primary: true },
  { href: "/investments", label: "Investments", msgKey: "nav.investments", icon: TrendingUp },
  { href: "/payments", label: "Bills", msgKey: "nav.payments", icon: ReceiptText },
  { href: "/calendar", label: "Calendar", msgKey: "nav.calendar", icon: Calendar },
  { href: "/analytics", label: "Analytics", msgKey: "nav.analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", msgKey: "nav.settings", icon: Settings },
];

/** Best-effort page title from a pathname for the top bar. */
export function titleForPath(pathname: string): string {
  const match = NAV_ITEMS.find(
    (i) => pathname === i.href || pathname.startsWith(i.href + "/"),
  );
  return match?.label ?? "Renew";
}

/** i18n message key for a pathname's page title, or null (→ "Renew"). */
export function titleKeyForPath(pathname: string): MessageKey | null {
  const match = NAV_ITEMS.find(
    (i) => pathname === i.href || pathname.startsWith(i.href + "/"),
  );
  return match?.msgKey ?? null;
}
