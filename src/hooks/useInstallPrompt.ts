"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/** The non-standard beforeinstallprompt event (Chromium). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const noopSubscribe = () => () => {};

interface InstallState {
  /** A native install prompt is available (Chromium). */
  canPrompt: boolean;
  /** iOS Safari — no native prompt; show manual Add-to-Home-Screen guidance. */
  isIOS: boolean;
  /** Already running as an installed app. */
  installed: boolean;
  /** Trigger the native prompt; resolves to true if the user accepted. */
  promptInstall: () => Promise<boolean>;
}

/**
 * Surfaces PWA install affordances. Uses the Chromium `beforeinstallprompt`
 * event where available, detects iOS (which needs manual instructions), and
 * hides itself once the app is installed / running standalone. Client-only
 * flags are read via useSyncExternalStore so SSR renders nothing and there is
 * no hydration mismatch.
 */
export function useInstallPrompt(): InstallState {
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setPromptEvent(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function promptInstall(): Promise<boolean> {
    if (!promptEvent) return false;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    setPromptEvent(null);
    return outcome === "accepted";
  }

  if (!mounted) {
    return { canPrompt: false, isIOS: false, installed: false, promptInstall };
  }

  const nav = window.navigator as Navigator & { standalone?: boolean };
  const installed =
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true;
  const isIOS =
    /iphone|ipad|ipod/i.test(nav.userAgent) &&
    !/crios|fxios/i.test(nav.userAgent);

  return { canPrompt: promptEvent !== null, isIOS, installed, promptInstall };
}
