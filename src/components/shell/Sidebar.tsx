"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { RenewMark } from "@/components/brand/RenewMark";
import { Wordmark } from "@/components/brand/Wordmark";
import { AccountMenu } from "./AccountMenu";
import type { ShellUser } from "./shell-types";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function Sidebar({ user }: { user: ShellUser }) {
  const pathname = usePathname();

  return (
    <aside className="glass fixed inset-y-0 left-0 z-30 hidden w-64 flex-col !rounded-none !rounded-r-glass-lg p-4 lg:flex">
      <Link
        href="/dashboard"
        className="mb-6 flex items-center gap-3 px-2 py-2"
        aria-label="Renew home"
      >
        <RenewMark size={34} />
        <Wordmark sizeClassName="text-lg" />
      </Link>

      <nav className="flex flex-1 flex-col gap-1" aria-label="Primary">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "text-[var(--text-strong)]"
                  : "text-[var(--text-body)] hover:bg-[var(--glass-bg-soft)] hover:text-[var(--text-strong)]",
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 -z-10 rounded-2xl bg-[var(--glass-bg-strong)] shadow-[inset_0_1px_0_var(--glass-edge)]"
                  transition={{ type: "spring", stiffness: 380, damping: 34 }}
                />
              )}
              <Icon
                className={cn(
                  "size-5 shrink-0",
                  active && "text-[var(--color-gold-500)]",
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-2 border-t border-[var(--glass-border)] pt-3">
        <AccountMenu user={user} align="left" />
      </div>
    </aside>
  );
}
