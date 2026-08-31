"use client";

import { useEffect } from "react";

/**
 * Registers the service worker in production AND keeps it fresh. The SW calls
 * skipWaiting()+clients.claim(), so when a new version deploys and is fetched it
 * takes control immediately and fires `controllerchange` — we reload once so the
 * page runs the new build. Without this, users stay on a cached old version
 * until they manually clear data. We also poll for updates on load and whenever
 * the tab regains focus. No-op in dev / unsupported.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    // On a returning visit the SW already controls the page; a later
    // `controllerchange` then means a NEW version took over → reload to it.
    // On the very first visit there's no controller yet, so the initial claim
    // must NOT trigger a reload.
    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    const onControllerChange = () => {
      if (!hadController || reloaded) return;
      reloaded = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    let reg: ServiceWorkerRegistration | null = null;
    const checkForUpdate = () => { reg?.update().catch(() => {}); };
    const onVisible = () => { if (document.visibilityState === "visible") checkForUpdate(); };

    const register = async () => {
      try {
        reg = await navigator.serviceWorker.register("/sw.js");
        checkForUpdate();
        document.addEventListener("visibilitychange", onVisible);
      } catch {
        /* registration is best-effort */
      }
    };

    const onLoad = () => { void register(); };
    // If the page is already loaded (fast nav), register now; else on load.
    if (document.readyState === "complete") void register();
    else window.addEventListener("load", onLoad);

    return () => {
      window.removeEventListener("load", onLoad);
      document.removeEventListener("visibilitychange", onVisible);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);
  return null;
}
