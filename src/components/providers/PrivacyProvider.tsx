"use client";

import { createContext, useCallback, useContext, useSyncExternalStore, type ReactNode } from "react";
import { useReauth } from "@/components/security/ReauthProvider";

/**
 * Private-by-default money. Every amount in Renew is masked (••••) until the
 * person chooses to reveal it, and revealing requires Face ID / passcode. This
 * is Renew's privacy stance: we don't put "how much you have" on screen (or in a
 * screenshot, or an over-the-shoulder glance) unless the owner asks — see
 * [[renew-privacy-principles]] in memory. Per-device preference (localStorage).
 */

const KEY = "renew-amounts-hidden";
const EVENT = "renew-privacy-change";

interface PrivacyCtx {
  hidden: boolean;
  toggle: () => void;
  mask: string;
}

const PrivacyContext = createContext<PrivacyCtx>({ hidden: false, toggle: () => {}, mask: "••••" });

export function usePrivacy(): PrivacyCtx {
  return useContext(PrivacyContext);
}

function read(): boolean {
  if (typeof window === "undefined") return true; // default hidden
  try {
    const v = localStorage.getItem(KEY);
    return v === null ? true : v === "1";
  } catch {
    return true;
  }
}

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const requireReauth = useReauth();

  const hidden = useSyncExternalStore(
    (cb) => {
      window.addEventListener(EVENT, cb);
      window.addEventListener("storage", cb);
      return () => {
        window.removeEventListener(EVENT, cb);
        window.removeEventListener("storage", cb);
      };
    },
    read,
    () => true,
  );

  const toggle = useCallback(async () => {
    if (hidden) {
      // Revealing is the sensitive direction — verify it's really the owner.
      if (!(await requireReauth("to show your balances"))) return;
      try { localStorage.setItem(KEY, "0"); } catch { /* ignore */ }
    } else {
      try { localStorage.setItem(KEY, "1"); } catch { /* ignore */ }
    }
    window.dispatchEvent(new Event(EVENT));
  }, [hidden, requireReauth]);

  return (
    <PrivacyContext.Provider value={{ hidden, toggle, mask: "••••" }}>
      {children}
    </PrivacyContext.Provider>
  );
}
