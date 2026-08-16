"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { RenewMark } from "@/components/brand/RenewMark";
import { NotificationBell } from "./NotificationBell";
import { AccountMenu } from "./AccountMenu";
import type { ShellUser } from "./shell-types";
import { titleForPath } from "@/lib/nav";

export function TopBar({ user }: { user: ShellUser }) {
  const pathname = usePathname();
  const title = titleForPath(pathname);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
      {/* Mobile brand / desktop page title */}
      <Link href="/dashboard" className="flex items-center gap-2 lg:hidden" aria-label="Renew home">
        <RenewMark size={30} />
      </Link>
      <h1 className="text-strong hidden text-lg font-medium lg:block">
        {title}
      </h1>

      <div className="flex items-center gap-2 sm:gap-3">
        <NotificationBell />
        {/* Account lives in the sidebar on desktop; show it here on mobile. */}
        <div className="lg:hidden">
          <AccountMenu user={user} />
        </div>
      </div>
    </header>
  );
}
