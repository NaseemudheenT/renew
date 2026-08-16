"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { AnimatedButton } from "@/components/motion";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Native install affordance. Only appears when the browser fires
 * `beforeinstallprompt` (Chromium) and the app isn't already installed.
 */
export function InstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferred(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!deferred) return null;

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] p-3.5">
      <div>
        <p className="text-body text-sm font-medium">Install Renew</p>
        <p className="text-muted text-xs">Add it to your device for a full-screen, app-like experience.</p>
      </div>
      <AnimatedButton size="sm" onClick={install}>
        <Download className="size-4" />
        Install
      </AnimatedButton>
    </div>
  );
}
