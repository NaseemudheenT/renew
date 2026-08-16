"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Check, Bell as BellIcon } from "lucide-react";
import { orderBy, limit } from "firebase/firestore";
import { useUserCollection } from "@/hooks/useUserCollection";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/firestore/notifications";
import { relativeTime } from "@/lib/dates";
import type { AppNotification } from "@/lib/types";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const constraints = useMemo(
    () => [orderBy("createdAt", "desc"), limit(20)],
    [],
  );
  const { data, uid } = useUserCollection<AppNotification>(
    "notifications",
    constraints,
  );
  const unread = data.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function onOpenNotification(n: AppNotification) {
    if (uid && !n.read) await markNotificationRead(uid, n.id).catch(() => {});
    setOpen(false);
    if (n.href) router.push(n.href);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        className="glass !rounded-full relative grid size-10 place-items-center text-[var(--text-body)] transition-all hover:-translate-y-px hover:text-[var(--text-strong)]"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-0.5 -top-0.5 grid min-w-[18px] place-items-center rounded-full bg-gradient-to-b from-gold-300 to-gold-500 px-1 text-[10px] font-semibold text-[var(--text-onGold)]"
          >
            {unread > 9 ? "9+" : unread}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="glass glass-strong absolute right-0 z-50 mt-2 flex max-h-[70vh] w-[min(92vw,22rem)] flex-col overflow-hidden !rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-4 py-3">
              <span className="text-strong text-sm font-medium">Notifications</span>
              {unread > 0 && uid && (
                <button
                  type="button"
                  onClick={() => markAllNotificationsRead(uid).catch(() => {})}
                  className="flex items-center gap-1 text-xs text-[var(--color-gold-600)] hover:underline"
                >
                  <Check className="size-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="overflow-y-auto">
              {data.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                  <BellIcon className="size-7 text-[var(--text-muted)]" />
                  <p className="text-muted text-sm">You&apos;re all caught up.</p>
                </div>
              ) : (
                data.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => onOpenNotification(n)}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--glass-bg-soft)]",
                      !n.read && "bg-[var(--glass-bg-soft)]",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        n.read ? "bg-transparent" : "bg-[var(--color-gold-400)]",
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="text-body block text-sm font-medium">
                        {n.title}
                      </span>
                      {n.body && (
                        <span className="text-muted block truncate text-xs">
                          {n.body}
                        </span>
                      )}
                      <span className="text-muted mt-0.5 block text-[11px]">
                        {relativeTime(n.createdAt)}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
