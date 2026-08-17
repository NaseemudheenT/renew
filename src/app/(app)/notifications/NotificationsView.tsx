"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { orderBy, limit } from "firebase/firestore";
import { Bell, ListTodo, Wallet, FileText, ShieldCheck, Check, Trash2, type LucideIcon } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { AnimatedButton } from "@/components/motion";
import { RowMenu } from "@/components/ui/RowMenu";
import { useUserCollection } from "@/hooks/useUserCollection";
import { markAllNotificationsRead, markNotificationRead, deleteNotification } from "@/lib/firestore/notifications";
import { relativeTime } from "@/lib/dates";
import type { AppNotification, NotificationType } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPE_ICON: Record<NotificationType, LucideIcon> = {
  reminder: Bell,
  task: ListTodo,
  payment: Wallet,
  document: FileText,
  account: ShieldCheck,
};

export function NotificationsView() {
  const constraints = useMemo(() => [orderBy("createdAt", "desc"), limit(100)], []);
  const { data, loading, uid } = useUserCollection<AppNotification>("notifications", constraints);
  const unread = data.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Notifications"
        subtitle={unread ? `${unread} unread` : "You're all caught up."}
        action={unread > 0 && uid ? <AnimatedButton variant="glass" size="sm" onClick={() => markAllNotificationsRead(uid).catch(() => {})}><Check className="size-4" />Mark all read</AnimatedButton> : undefined}
      />
      {!loading && data.length === 0 ? (
        <GlassCard padded><EmptyState icon={Bell} title="No notifications yet" description="As reminders, payments and documents approach their dates, gentle nudges will appear here." /></GlassCard>
      ) : (
        <div className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {data.map((n) => {
              const Icon = TYPE_ICON[n.type];
              return (
                <motion.div key={n.id} layout="position" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }} transition={{ type: "spring", stiffness: 320, damping: 32 }} className={cn("glass flex items-start gap-3 p-3.5", !n.read && "bg-[var(--glass-bg-strong)]")}>
                  <span className="glass grid size-9 shrink-0 place-items-center !rounded-xl"><Icon className="size-4.5 text-[var(--color-gold-500)]" /></span>
                  <Link href={n.href ?? "#"} onClick={() => uid && !n.read && markNotificationRead(uid, n.id).catch(() => {})} className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-strong text-sm font-medium">{n.title}</span>
                      {!n.read && <span className="size-2 shrink-0 rounded-full bg-[var(--color-gold-400)]" />}
                    </div>
                    {n.body && <p className="text-muted mt-0.5 text-sm">{n.body}</p>}
                    <p className="text-muted mt-0.5 text-xs">{relativeTime(n.createdAt)}</p>
                  </Link>
                  <RowMenu items={[...(!n.read && uid ? [{ label: "Mark read", icon: Check, onClick: () => markNotificationRead(uid, n.id).catch(() => {}) }] : []), { label: "Delete", icon: Trash2, onClick: () => uid && deleteNotification(uid, n.id).catch(() => {}), danger: true }]} />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
