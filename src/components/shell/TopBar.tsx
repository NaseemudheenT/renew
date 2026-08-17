"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { RenewMark } from "@/components/brand/RenewMark";
import { NotificationBell } from "./NotificationBell";
import { GlobalSearch } from "./GlobalSearch";
import { InstallRenew } from "@/components/pwa/InstallRenew";
import { AccountMenu } from "./AccountMenu";
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
        "sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 transition-all duration-300 sm:px-6 lg:px-8",
        scrolled && "border-b border-[var(--glass-border)] bg-[var(--glass-bg-soft)] backdrop-blur-md",
      )}
    >
      <Link href="/dashboard" className="flex items-center gap-2 lg:hidden" aria-label="Renew home">
        <RenewMark size={30} />
      </Link>
      <h1 className="text-strong hidden text-lg font-medium lg:block">{title}</h1>
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
