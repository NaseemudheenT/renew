"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bell, Check, ListTodo, Wallet, FileText, ShieldCheck, Target, PiggyBank, RefreshCw, type LucideIcon } from "lucide-react";
import { orderBy, limit } from "firebase/firestore";
import { useUserCollection } from "@/hooks/useUserCollection";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/firestore/notifications";
import { relativeTime } from "@/lib/dates";
import { PopoverPortal } from "@/components/ui/PopoverPortal";
import type { AppNotification, NotificationType } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPE_ICON: Record<NotificationType, LucideIcon> = {
  reminder: Bell, task: ListTodo, payment: Wallet, document: FileText,
  account: ShieldCheck, budget: Target, savings: PiggyBank, subscription: RefreshCw,
};

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const constraints = useMemo(() => [orderBy("createdAt", "desc"), limit(20)], []);
  const { data, uid } = useUserCollection<AppNotification>("notifications", constraints);
  const unread = data.filter((n) => !n.read).length;

  async function openNotification(n: AppNotification) {
    if (uid && !n.read) await markNotificationRead(uid, n.id).catch(() => {});
    setOpen(false);
    if (n.href) router.push(n.href);
  }

  return (
    <>
      <button
        ref={anchorRef}
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
            className="absolute -end-0.5 -top-0.5 grid min-w-[18px] place-items-center rounded-full bg-gradient-to-b from-gold-300 to-gold-500 px-1 text-[10px] font-semibold text-[var(--text-onGold)]"
          >
            {unread > 9 ? "9+" : unread}
          </motion.span>
        )}
      </button>

      <PopoverPortal anchorRef={anchorRef} open={open} onClose={() => setOpen(false)} minWidth={320} align="end">
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 30 }}
          style={{ transformOrigin: "top right" }}
          className="flex min-h-0 w-[min(92vw,22rem)] flex-1 flex-col overflow-hidden rounded-3xl border border-[var(--menu-border)] bg-[var(--menu-bg)] shadow-[var(--glass-shadow)] backdrop-blur-xl"
        >
          <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-4 py-3">
              <span className="text-strong text-sm font-medium">Notifications</span>
              {unread > 0 && uid && (
                <button type="button" onClick={() => markAllNotificationsRead(uid).catch(() => {})} className="flex items-center gap-1 text-xs text-[var(--color-gold-600)] hover:underline">
                  <Check className="size-3.5" />
                  Mark all read
                </button>
              )}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {data.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                  <Bell className="size-7 text-[var(--text-muted)]" />
                  <p className="text-muted text-sm">You&apos;re all caught up.</p>
                </div>
              ) : (
                data.map((n) => {
                  const Icon = TYPE_ICON[n.type] ?? Bell;
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => openNotification(n)}
                      className={cn("flex w-full items-start gap-3 px-4 py-3 text-start transition-colors hover:bg-[var(--glass-bg-soft)]", !n.read && "bg-[var(--glass-bg-strong)] shadow-[inset_2px_0_0_var(--color-gold-500)]")}
                    >
                      <span className="glass grid size-8 shrink-0 place-items-center !rounded-xl"><Icon className="size-4 text-[var(--color-gold-500)]" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="text-strong flex items-center gap-1.5 text-sm font-medium">{n.title}{!n.read && <span className="size-1.5 shrink-0 rounded-full bg-[var(--color-gold-400)]" />}</span>
                        {n.body && <span className="text-muted mt-0.5 block truncate text-xs">{n.body}</span>}
                        <span className="text-muted mt-0.5 block text-[11px]">{relativeTime(n.createdAt)}</span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          <Link href="/notifications" onClick={() => setOpen(false)} className="border-t border-[var(--glass-border)] px-4 py-2.5 text-center text-xs font-medium text-[var(--color-gold-600)] hover:bg-[var(--glass-bg-soft)]">
            See all notifications
          </Link>
        </motion.div>
      </PopoverPortal>
    </>
  );
}
