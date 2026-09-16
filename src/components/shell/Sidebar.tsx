"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { RenewMark } from "@/components/brand/RenewMark";
import { Wordmark } from "@/components/brand/Wordmark";
import { RenLogo } from "@/components/brand/RenLogo";
import { AccountMenu } from "./AccountMenu";
import type { ShellUser } from "./shell-types";
import { navItemsFor } from "@/lib/nav";
import { openRen } from "@/lib/ren-open";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useSidebarCollapsed } from "./sidebar-store";
import { cn } from "@/lib/utils";

export function Sidebar({ user }: { user: ShellUser }) {
  const pathname = usePathname();
  const { t } = useLocale();
  const { mode } = useWorkspace();
  const collapsed = useSidebarCollapsed();
  // Settings lives in the account menu (below) — no duplicate nav row under
  // Analytics, so there's exactly one Settings in the panel.
  const items = navItemsFor(mode).filter((i) => i.href !== "/settings");
  return (
    <motion.aside
      className="glass hidden h-full shrink-0 flex-col overflow-hidden !rounded-none !rounded-e-glass-lg lg:flex"
      initial={false}
      animate={{ width: collapsed ? 0 : 256 }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
    >
    <div className="flex h-full w-64 flex-col p-4">
      <Link href="/dashboard" className="mb-6 flex shrink-0 items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-[var(--glass-bg-soft)]" aria-label="Renew home">
        <RenewMark size={34} />
        <Wordmark sizeClassName="text-lg" />
      </Link>
      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain" aria-label="Primary">
        {/* Ren, right in the menu — talk to your finance assistant. */}
        <button
          type="button"
          onClick={() => openRen()}
          className="group mb-1 flex items-center gap-3 rounded-2xl py-2.5 pe-3 ps-2.5 text-sm font-medium text-[var(--text-body)] transition-colors duration-300 hover:bg-[var(--glass-bg-soft)] hover:text-[var(--text-strong)]"
        >
          <span className="grid size-6 shrink-0 place-items-center transition-transform duration-300 group-hover:scale-110">
            <RenLogo size={24} idSuffix="sidebar" />
          </span>
          Ask Ren
        </button>
        {items.map(({ href, msgKey, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-2xl py-2.5 pe-3 ps-4 text-sm font-medium transition-colors duration-300",
                active ? "text-[var(--text-strong)]" : "text-[var(--text-body)] hover:bg-[var(--glass-bg-soft)] hover:text-[var(--text-strong)]",
              )}
            >
              {active && (
                <>
                  {/* Floating glass pill + a leading champagne accent bar. */}
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 -z-10 rounded-2xl bg-[var(--glass-bg-strong)] shadow-[inset_0_1px_0_var(--glass-edge)]"
                    transition={{ type: "spring", stiffness: 380, damping: 34 }}
                  />
                  <motion.span
                    layoutId="sidebar-accent"
                    className="absolute start-1 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-[var(--color-gold-500)]"
                    transition={{ type: "spring", stiffness: 380, damping: 34 }}
                  />
                </>
              )}
              <Icon
                className={cn(
                  "size-5 shrink-0 transition-all duration-300",
                  active ? "scale-110 text-[var(--color-gold-500)]" : "group-hover:translate-x-0.5",
                )}
              />
              {t(msgKey)}
            </Link>
          );
        })}
      </nav>
      <div className="mt-2 shrink-0 border-t border-[var(--glass-border)] pt-3">
        <AccountMenu user={user} align="left" />
      </div>
    </div>
    </motion.aside>
  );
}
