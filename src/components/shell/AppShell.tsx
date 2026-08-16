"use client";

import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { TopBar } from "./TopBar";
import type { ShellUser } from "./shell-types";

/**
 * The persistent application frame: a fixed sidebar on desktop, a bottom tab
 * bar on mobile, and a top bar with notifications + account. Content scrolls
 * in the main region; the atmospheric background sits behind everything.
 */
export function AppShell({
  user,
  children,
}: {
  user: ShellUser;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh lg:pl-64">
      <Sidebar user={user} />
      <div className="flex min-h-dvh flex-col">
        <TopBar user={user} />
        <main className="flex-1 px-4 pb-28 pt-1 sm:px-6 lg:px-8 lg:pb-10">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
