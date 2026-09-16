"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { RenewMark } from "@/components/brand/RenewMark";
import { Wordmark } from "@/components/brand/Wordmark";
import { AccountMenu } from "./AccountMenu";
import type { ShellUser } from "./shell-types";
import { navItemsFor } from "@/lib/nav";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { cn } from "@/lib/utils";

/** Colourful icon tile per destination — matches the Settings look. */
const NAV_TONE: Record<string, string> = {
  "/dashboard": "#5b6cff",
  "/accounts": "#14b8a6",
  "/transactions": "#4a7bff",
  "/budget": "#ff9f0a",
  "/savings": "#34c759",
  "/income": "#2fbf71",
  "/payments": "#ff5e8a",
  "/analytics": "#a15cff",
  "/settings": "#6b7684",
};

/**
 * The full left menu, on phones. Desktop has the fixed sidebar; on mobile the
 * same menu slides in from the left (tap the hamburger), so the experience
 * matches desktop. The bottom tab bar stays for quick thumb navigation — this is
 * the complete menu with every destination + account.
 */
export function MobileMenu({ user }: { user: ShellUser }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useLocale();
  const { mode } = useWorkspace();
  // Full menu, in nav order — Settings stays below Analytics as well as being
  // reachable from the account, so it's always one tap away.
  const items = navItemsFor(mode);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Open menu"
        className="grid size-9 shrink-0 place-items-center rounded-full text-[var(--text-body)] transition-colors hover:bg-[var(--glass-bg-soft)] hover:text-[var(--text-strong)] lg:hidden">
        <Menu className="size-5" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)} aria-hidden />
            <motion.aside
              className="glass fixed inset-y-0 left-0 z-50 flex w-72 max-w-[82%] flex-col !rounded-none !rounded-e-glass-lg p-4 lg:hidden"
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0.6, right: 0 }}
              onDragEnd={(_e, info) => { if (info.offset.x < -70 || info.velocity.x < -500) setOpen(false); }}
              role="dialog" aria-label="Menu"
            >
              <div className="mb-6 flex items-center justify-between">
                <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-3" aria-label="Renew home">
                  <RenewMark size={32} />
                  <Wordmark sizeClassName="text-lg" />
                </Link>
                <button type="button" onClick={() => setOpen(false)} aria-label="Close menu"
                  className="grid size-9 place-items-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--glass-bg-soft)] hover:text-[var(--text-strong)]">
                  <X className="size-5" />
                </button>
              </div>

              <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain" aria-label="Primary">
                {items.map(({ href, msgKey, icon: Icon }) => {
                  const active = pathname === href || pathname.startsWith(href + "/");
                  return (
                    <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl py-2 pe-3 ps-2 text-sm font-medium transition-colors",
                        active ? "bg-[var(--glass-bg-strong)] text-[var(--text-strong)]" : "text-[var(--text-body)] hover:bg-[var(--glass-bg-soft)] hover:text-[var(--text-strong)]",
                      )}>
                      <span className="grid size-8 shrink-0 place-items-center rounded-[0.6rem] shadow-sm" style={{ background: NAV_TONE[href] ?? "#6b7280" }}>
                        <Icon className="size-4.5 text-white" />
                      </span>
                      {t(msgKey)}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-2 shrink-0 border-t border-[var(--glass-border)] pt-3">
                <AccountMenu user={user} align="left" />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
