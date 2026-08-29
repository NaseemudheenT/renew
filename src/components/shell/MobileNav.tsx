"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { MoreHorizontal, X } from "lucide-react";
import { navItemsFor } from "@/lib/nav";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useLocale();
  const { mode } = useWorkspace();
  const [moreOpen, setMoreOpen] = useState(false);
  const items = navItemsFor(mode);
  const primary = items.filter((i) => i.primary);
  // Everything not on the bottom bar — reachable from the More sheet, so the
  // phone has full parity with the desktop sidebar (no page is URL-only).
  const secondary = items.filter((i) => !i.primary);
  const moreActive = secondary.some((i) => pathname === i.href || pathname.startsWith(i.href + "/"));

  const tabs = [
    ...primary.map((i) => ({ href: i.href, msgKey: i.msgKey, icon: i.icon, isMore: false as const })),
    { href: "#more", msgKey: "nav.more" as MessageKey, icon: MoreHorizontal, isMore: true as const },
  ];

  return (
    <>
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMoreOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            role="dialog"
            aria-label={t("nav.more")}
            className="glass fixed inset-x-0 bottom-0 z-40 !rounded-b-none !rounded-t-glass px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 lg:hidden"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-strong text-sm font-medium">{t("nav.more")}</h2>
              <button type="button" onClick={() => setMoreOpen(false)} aria-label="Close" className="grid size-8 place-items-center rounded-full text-[var(--text-muted)] hover:bg-[var(--glass-bg-strong)] hover:text-[var(--text-strong)]">
                <X className="size-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {secondary.map(({ href, msgKey, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link key={msgKey} href={href} onClick={() => setMoreOpen(false)}
                    className={cn("flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-xs font-medium transition-colors",
                      active ? "border-[var(--focus-ring)] bg-[var(--glass-bg-strong)] text-[var(--text-strong)]" : "border-[var(--field-border)] bg-[var(--field-bg)] text-[var(--text-body)] hover:text-[var(--text-strong)]")}>
                    <Icon className={cn("size-5 transition-transform duration-300", active ? "-translate-y-0.5 scale-110 text-[var(--color-gold-500)]" : "text-[var(--text-muted)]")} />
                    {t(msgKey)}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="glass fixed inset-x-0 bottom-0 z-30 flex !rounded-none !rounded-t-glass px-2 pb-[env(safe-area-inset-bottom)] pt-1.5 lg:hidden" aria-label="Primary">
        {tabs.map(({ href, msgKey, icon: Icon, isMore }) => {
          const active = isMore ? moreActive || moreOpen : pathname === href || pathname.startsWith(href + "/");
          const label = t(msgKey);
          const inner = (
            <>
              <span className="relative grid place-items-center">
                {active && (
                  <motion.span layoutId="mobile-active" className="absolute -inset-x-3 -inset-y-1.5 -z-10 rounded-full bg-[var(--glass-bg-strong)]" transition={{ type: "spring", stiffness: 380, damping: 34 }} />
                )}
                <Icon className={cn("size-5 transition-transform duration-300", active ? "-translate-y-0.5 scale-110 text-[var(--color-gold-500)]" : "text-[var(--text-muted)]")} />
              </span>
              <span className={cn(active ? "text-[var(--text-strong)]" : "text-[var(--text-muted)]")}>{label}</span>
            </>
          );
          const className = "relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium";
          return isMore ? (
            <button key={msgKey} type="button" onClick={() => setMoreOpen((v) => !v)} aria-expanded={moreOpen} className={className}>{inner}</button>
          ) : (
            <Link key={msgKey} href={href} onClick={() => setMoreOpen(false)} aria-current={active ? "page" : undefined} className={className}>{inner}</Link>
          );
        })}
      </nav>
    </>
  );
}
