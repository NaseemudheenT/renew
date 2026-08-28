import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Target,
  PiggyBank,
  ReceiptText,
  RefreshCw,
  BarChart3,
  Settings,
  ArrowDownLeft,
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
  { href: "/accounts", label: "Accounts", msgKey: "nav.accounts", icon: Wallet, primary: true },
  { href: "/income", label: "Income", msgKey: "nav.income", icon: ArrowDownLeft },
  { href: "/transactions", label: "Transactions", msgKey: "nav.transactions", icon: ArrowLeftRight, primary: true },
  { href: "/budget", label: "Budget", msgKey: "nav.budget", icon: Target, primary: true },
  { href: "/savings", label: "Savings", msgKey: "nav.savings", icon: PiggyBank },
  { href: "/payments", label: "Bills", msgKey: "nav.payments", icon: ReceiptText },
  { href: "/subscriptions", label: "Subscriptions", msgKey: "nav.subscriptions", icon: RefreshCw },
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
