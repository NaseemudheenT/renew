"use client";

/**
 * Browser notification helpers. These surface Renew's in-app notifications as
 * OS notifications when the user has granted permission and the tab is in the
 * background. True server-pushed background delivery would require FCM (owner
 * config); this covers the "browser notifications when permitted" case locally.
 */

export type NotifyStatus = "unsupported" | "default" | "granted" | "denied";

export function browserNotifyStatus(): NotifyStatus {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission as NotifyStatus;
}

export async function requestBrowserNotify(): Promise<NotifyStatus> {
  if (browserNotifyStatus() === "unsupported") return "unsupported";
  try {
    const result = await Notification.requestPermission();
    return result as NotifyStatus;
  } catch {
    return "denied";
  }
}

export interface BrowserNotifyItem {
  id: string;
  title: string;
  body?: string;
  href?: string;
}

/**
 * Show an OS notification for a Renew item. Prefers the service-worker
 * registration (so clicks can focus/open the app) and falls back to the
 * Notification constructor. No-op unless permission is granted.
 */
export async function showBrowserNotification(item: BrowserNotifyItem): Promise<void> {
  if (browserNotifyStatus() !== "granted") return;
  const options: NotificationOptions = {
    body: item.body,
    icon: "/icon.svg",
    badge: "/favicon.svg",
    tag: item.id, // dedupe: the same item never stacks
    data: { href: item.href ?? "/notifications" },
  };
  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(item.title, options);
      return;
    }
  } catch {
    /* fall through to the constructor */
  }
  try {
    new Notification(item.title, options);
  } catch {
    /* nothing more we can do */
  }
}
