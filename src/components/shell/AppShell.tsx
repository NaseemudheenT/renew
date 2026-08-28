"use client";

import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { TopBar } from "./TopBar";
import { NotificationSync } from "./NotificationSync";
import { ReauthProvider } from "@/components/security/ReauthProvider";
import { PrivacyProvider } from "@/components/providers/PrivacyProvider";
import { WorkspaceProvider } from "@/components/providers/WorkspaceProvider";
import type { ShellUser } from "./shell-types";

/** Persistent application frame: glass sidebar (desktop), bottom tabs (mobile). */
export function AppShell({ user, children }: { user: ShellUser; children: ReactNode }) {
  return (
    <div className="min-h-dvh lg:ps-64">
      {/* Keyboard/screen-reader users can jump straight to the page content. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:border focus:border-[var(--glass-border)] focus:bg-[var(--glass-bg-strong)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[var(--text-strong)] focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
      >
        Skip to content
      </a>
      <NotificationSync />
      <WorkspaceProvider>
        <ReauthProvider>
          <PrivacyProvider>
            <Sidebar user={user} />
            <div className="flex min-h-dvh flex-col">
              <TopBar user={user} />
              <main id="main-content" tabIndex={-1} className="flex-1 px-4 pb-28 pt-1 outline-none sm:px-6 lg:px-8 lg:pb-10">
                {children}
              </main>
            </div>
            <MobileNav />
          </PrivacyProvider>
        </ReauthProvider>
      </WorkspaceProvider>
    </div>
  );
}
