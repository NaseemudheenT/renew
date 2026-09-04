"use client";

import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { TopBar } from "./TopBar";
import { NotificationSync } from "./NotificationSync";
import { RetentionCleanup } from "@/components/providers/RetentionCleanup";
import { RenLauncher } from "@/components/finance/RenLauncher";
import { ReauthProvider } from "@/components/security/ReauthProvider";
import { PrivacyProvider } from "@/components/providers/PrivacyProvider";
import { WorkspaceProvider } from "@/components/providers/WorkspaceProvider";
import type { ShellUser } from "./shell-types";

/**
 * Persistent application frame. The frame is the exact height of the viewport
 * and NEVER scrolls itself — the sidebar (desktop) and top bar are fixed parts
 * of the frame, and ONLY the <main> content pane scrolls. This is why the left
 * panel can never move: the page has no scroll to carry it. Bottom tabs on mobile.
 */
export function AppShell({ user, children }: { user: ShellUser; children: ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Keyboard/screen-reader users can jump straight to the page content. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:border focus:border-[var(--glass-border)] focus:bg-[var(--glass-bg-strong)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[var(--text-strong)] focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
      >
        Skip to content
      </a>
      <NotificationSync />
      <RetentionCleanup />
      <WorkspaceProvider>
        <ReauthProvider>
          <PrivacyProvider>
            {/* Fixed left panel (desktop) — a real flex column, so it stays put. */}
            <Sidebar user={user} />
            {/* The scrolling world lives only here. */}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <TopBar user={user} />
              <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto overscroll-contain px-4 pb-28 pt-1 outline-none sm:px-6 lg:px-8 lg:pb-10">
                {children}
              </main>
            </div>
            <MobileNav />
            <RenLauncher />
          </PrivacyProvider>
        </ReauthProvider>
      </WorkspaceProvider>
    </div>
  );
}
