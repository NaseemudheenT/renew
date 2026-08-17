"use client";

import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { TopBar } from "./TopBar";
import { NotificationSync } from "./NotificationSync";
import type { ShellUser } from "./shell-types";

/** Persistent application frame: glass sidebar (desktop), bottom tabs (mobile). */
export function AppShell({ user, children }: { user: ShellUser; children: ReactNode }) {
  return (
    <div className="min-h-dvh lg:pl-64">
      <NotificationSync />
      <Sidebar user={user} />
      <div className="flex min-h-dvh flex-col">
        <TopBar user={user} />
        <main className="flex-1 px-4 pb-28 pt-1 sm:px-6 lg:px-8 lg:pb-10">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
