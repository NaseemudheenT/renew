"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { MoreHorizontal } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useLocale();
  const primary = NAV_ITEMS.filter((i) => i.primary);
  const moreActive = ["/payments", "/documents", "/analytics", "/settings"].some((h) => pathname.startsWith(h));

  const tabs = [
    ...primary.map((i) => ({ href: i.href, msgKey: i.msgKey, icon: i.icon, isMore: false as const })),
    { href: "/settings", msgKey: "nav.more" as MessageKey, icon: MoreHorizontal, isMore: true as const },
  ];

  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-30 flex !rounded-none !rounded-t-glass px-2 pb-[env(safe-area-inset-bottom)] pt-1.5 lg:hidden" aria-label="Primary">
      {tabs.map(({ href, msgKey, icon: Icon, isMore }) => {
        const active = isMore ? moreActive : pathname === href || pathname.startsWith(href + "/");
        const label = t(msgKey);
        return (
          <Link key={msgKey} href={href} aria-current={active ? "page" : undefined} className="relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium">
            <span className="relative grid place-items-center">
              {active && (
                <motion.span layoutId="mobile-active" className="absolute -inset-x-3 -inset-y-1.5 -z-10 rounded-full bg-[var(--glass-bg-strong)]" transition={{ type: "spring", stiffness: 380, damping: 34 }} />
              )}
              <Icon className={cn("size-5", active ? "text-[var(--color-gold-500)]" : "text-[var(--text-muted)]")} />
            </span>
            <span className={cn(active ? "text-[var(--text-strong)]" : "text-[var(--text-muted)]")}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
