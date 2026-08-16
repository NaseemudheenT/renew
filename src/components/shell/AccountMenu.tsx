"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Settings, LogOut, ChevronDown } from "lucide-react";
import { Avatar } from "./Avatar";
import type { ShellUser } from "./shell-types";
import { signOutUser } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

export function AccountMenu({
  user,
  align = "right",
}: {
  user: ShellUser;
  align?: "left" | "right";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  async function onSignOut() {
    setOpen(false);
    await signOutUser();
    router.replace("/sign-in");
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full p-1 pr-2 transition-colors hover:bg-[var(--glass-bg-soft)]"
      >
        <Avatar user={user} size={34} />
        <ChevronDown
          className={cn(
            "size-4 text-[var(--text-muted)] transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "glass glass-strong absolute z-50 mt-2 w-64 overflow-hidden !rounded-2xl p-2",
              align === "right" ? "right-0" : "left-0",
            )}
          >
            <div className="flex items-center gap-3 px-3 py-3">
              <Avatar user={user} size={40} />
              <div className="min-w-0">
                <p className="text-strong truncate text-sm font-medium">
                  {user.displayName || "Your account"}
                </p>
                <p className="text-muted truncate text-xs">{user.email}</p>
              </div>
            </div>

            <div className="my-1 h-px bg-[var(--glass-border)]" />

            <Link
              href="/settings"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="text-body flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-[var(--glass-bg-soft)] hover:text-[var(--text-strong)]"
            >
              <Settings className="size-4.5" />
              Settings
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={onSignOut}
              className="text-body flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-300"
            >
              <LogOut className="size-4.5" />
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
