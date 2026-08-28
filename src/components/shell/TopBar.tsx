"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { RenewMark } from "@/components/brand/RenewMark";
import { NotificationBell } from "./NotificationBell";
import { GlobalSearch } from "./GlobalSearch";
import { InstallRenew } from "@/components/pwa/InstallRenew";
import { AccountMenu } from "./AccountMenu";
import { WorkspaceSwitch } from "./WorkspaceSwitch";
import type { ShellUser } from "./shell-types";
import { titleKeyForPath } from "@/lib/nav";
import { useLocale } from "@/components/providers/LocaleProvider";
import { usePrivacy } from "@/components/providers/PrivacyProvider";
import { cn } from "@/lib/utils";

export function TopBar({ user }: { user: ShellUser }) {
  const pathname = usePathname();
  const { t } = useLocale();
  const { hidden, toggle } = usePrivacy();
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
        <Link href="/dashboard" className="flex items-center gap-2 lg:hidden" aria-label="Renew home">
          <RenewMark size={30} />
        </Link>
        <h1 className="text-strong hidden text-lg font-medium lg:block">{title}</h1>
        <WorkspaceSwitch />
        <button
          type="button"
          onClick={toggle}
          aria-label={hidden ? "Show amounts" : "Hide amounts"}
          title={hidden ? "Show amounts" : "Hide amounts"}
          className="grid size-10 shrink-0 place-items-center rounded-full text-[var(--text-body)] transition-colors hover:bg-[var(--glass-bg-soft)] hover:text-[var(--text-strong)]"
        >
          {hidden ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
        </button>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <InstallRenew />
        <GlobalSearch />
        <NotificationBell />
        <div className="lg:hidden">
          <AccountMenu user={user} />
        </div>
      </div>
    </header>
  );
}
