"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Settings, LogOut, ChevronDown, CircleUserRound } from "lucide-react";
import { Avatar } from "./Avatar";
import type { ShellUser } from "./shell-types";
import { useUserProfile } from "@/hooks/useUserProfile";
import { signOutUser } from "@/lib/auth/client";
import { useReauth } from "@/components/security/ReauthProvider";
import { PopoverPortal } from "@/components/ui/PopoverPortal";
import { cn } from "@/lib/utils";

/** Account dropdown — clean: profile, settings, sign out. (Passkeys are managed
 *  in Settings › your account; theme lives in Settings.) `onNavigate` lets a
 *  parent (the mobile menu panel) close itself when an item is chosen. */
export function AccountMenu({ user, align = "right", onNavigate }: { user: ShellUser; align?: "left" | "right"; onNavigate?: () => void }) {
  const router = useRouter();
  const { profile } = useUserProfile();
  const requireReauth = useReauth();
  const displayName = profile?.displayName || user.displayName || "Your account";
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  function go() { setOpen(false); onNavigate?.(); }

  async function onSignOut() {
    setOpen(false);
    // Confirm it's really you (Face ID / passcode) before signing out — keeps a
    // shoulder-surfer from signing you out. No lock set → resolves through.
    if (!(await requireReauth("Confirm it's you to sign out"))) return;
    onNavigate?.();
    await signOutUser();
    router.replace("/sign-in");
  }

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full p-1 pr-2 transition-colors hover:bg-[var(--glass-bg-soft)]"
      >
        <Avatar user={user} size={34} />
        <ChevronDown className={cn("size-4 text-[var(--text-muted)] transition-transform", open && "rotate-180")} />
      </button>

      <PopoverPortal anchorRef={anchorRef} open={open} onClose={() => setOpen(false)} minWidth={256} align={align === "right" ? "end" : "start"}>
        <motion.div
          role="menu"
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="w-64 overflow-hidden rounded-2xl border border-[var(--menu-border)] bg-[var(--menu-bg)] p-2 shadow-[var(--glass-shadow)] backdrop-blur-xl"
        >
          <Link
            href="/account"
            onClick={go}
            className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-[var(--glass-bg-soft)]"
          >
            <Avatar user={user} size={40} />
            <p className="text-strong min-w-0 truncate text-sm font-medium">{displayName}</p>
          </Link>
          <div className="my-1 h-px bg-[var(--glass-border)]" />
          <Link
            href="/account"
            role="menuitem"
            onClick={go}
            className="text-body flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-[var(--glass-bg-soft)] hover:text-[var(--text-strong)]"
          >
            <CircleUserRound className="size-4.5" />
            Your account
          </Link>
          <Link
            href="/settings"
            role="menuitem"
            onClick={go}
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
      </PopoverPortal>
    </>
  );
}
