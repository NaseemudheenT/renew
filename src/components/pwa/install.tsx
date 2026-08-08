"use client";

/**
 * PWA install + service-worker manager.
 * - Registers /sw.js (enables installability + offline fallback).
 * - Captures the `beforeinstallprompt` event so the app can offer its own,
 *   on-brand "Install app" control (Chrome / Edge / Android).
 * - Detects already-installed (standalone) mode.
 * iOS Safari has no programmatic prompt; there we surface a short hint instead.
 */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallState {
  canInstall: boolean;
  installed: boolean;
  isIOS: boolean;
  promptInstall: () => void;
}

const InstallContext = createContext<InstallState>({
  canInstall: false,
  installed: false,
  isIOS: false,
  promptInstall: () => {},
});

function standalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function PwaManager({ children }: { children: React.ReactNode }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState<boolean>(() => standalone());
  const [isIOS] = useState<boolean>(
    () => typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent),
  );

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "production") {
        navigator.serviceWorker.register("/sw.js").catch(() => {
          /* SW is an enhancement; the app works without it */
        });
      } else {
        // In dev, make sure no stale SW cache interferes with HMR / routing.
        navigator.serviceWorker
          .getRegistrations()
          .then((regs) => regs.forEach((r) => r.unregister()))
          .catch(() => {});
      }
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }, [deferred]);

  return (
    <InstallContext.Provider
      value={{ canInstall: !!deferred && !installed, installed, isIOS, promptInstall }}
    >
      {children}
    </InstallContext.Provider>
  );
}

export function useInstall() {
  return useContext(InstallContext);
}

/** Subtle "Install app" pill — only appears when the app can be installed. */
export function InstallButton({ className }: { className?: string }) {
  const { canInstall, promptInstall } = useInstall();
  if (!canInstall) return null;

  return (
    <button
      type="button"
      onClick={promptInstall}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface)]/60 px-4 py-2 text-xs font-medium tracking-wide text-[var(--muted)] backdrop-blur transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)]",
        className,
      )}
    >
      <Download className="size-4" />
      Install app
    </button>
  );
}
