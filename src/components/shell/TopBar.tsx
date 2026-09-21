"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PanelLeft, Search } from "lucide-react";
import { openCommand } from "@/lib/command-open";
import { MobileMenu } from "./MobileMenu";
import { toggleSidebar } from "./sidebar-store";
import { NotificationBell } from "./NotificationBell";
import { InstallRenew } from "@/components/pwa/InstallRenew";
import { WorkspaceSwitch } from "./WorkspaceSwitch";
import type { ShellUser } from "./shell-types";
import { titleKeyForPath } from "@/lib/nav";
import { useLocale } from "@/components/providers/LocaleProvider";
import { cn } from "@/lib/utils";

export function TopBar({ user }: { user: ShellUser }) {
  const pathname = usePathname();
  const { t } = useLocale();
  const titleKey = titleKeyForPath(pathname);
  const title = titleKey ? t(titleKey) : "Renew";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        // pt clears the notch/status bar when installed (safe-area inset); falls back to the normal padding in a browser.
        "sticky top-0 z-20 flex items-center justify-between gap-3 px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] transition-all duration-300 sm:px-6 lg:px-8",
        scrolled && "border-b border-[var(--glass-border)] bg-[var(--glass-bg-strong)] backdrop-blur-xl backdrop-saturate-150",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={toggleSidebar} aria-label="Hide or show menu"
          className="hidden size-9 shrink-0 place-items-center rounded-full text-[var(--text-body)] transition-colors hover:bg-[var(--glass-bg-soft)] hover:text-[var(--text-strong)] lg:grid">
          <PanelLeft className="size-5" />
        </button>
        <MobileMenu user={user} />
        {/* Brand + account live in the menu panel (and desktop sidebar), so the
            top bar just shows the current page — no duplicate logo/avatar. */}
        <h1 className="text-strong truncate text-lg font-medium">{title}</h1>
        <WorkspaceSwitch />
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global smart search / command palette — capsule on desktop, icon on phone. */}
        <button type="button" onClick={openCommand} aria-label="Search or run a command"
          className="flex h-9 items-center gap-2 rounded-full border border-[var(--field-border)] bg-[var(--field-bg)] px-2.5 text-[var(--text-muted)] transition-colors hover:border-[var(--focus-ring)]/50 hover:text-[var(--text-strong)] sm:pe-2 sm:ps-3">
          <Search className="size-4 shrink-0" />
          <span className="hidden text-sm sm:inline">Search…</span>
          <kbd className="hidden rounded border border-[var(--glass-border)] px-1.5 py-0.5 text-[10px] lg:inline">⌘K</kbd>
        </button>
        <InstallRenew />
        <NotificationBell />
      </div>
    </header>
  );
}
