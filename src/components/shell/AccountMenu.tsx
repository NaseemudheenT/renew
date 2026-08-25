"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Settings, LogOut, ChevronDown, Fingerprint, CircleUserRound } from "lucide-react";
import { Avatar } from "./Avatar";
import type { ShellUser } from "./shell-types";
import { signOutUser, AuthError } from "@/lib/auth/client";
import { registerPasskey, usePasskeySupport } from "@/lib/auth/passkey-client";
import { PopoverPortal } from "@/components/ui/PopoverPortal";
import { toast } from "@/components/ui/toast-store";
import { cn } from "@/lib/utils";

/** Account dropdown — no theme toggle (theme lives in Settings). */
export function AccountMenu({ user, align = "right" }: { user: ShellUser; align?: "left" | "right" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [addingPasskey, setAddingPasskey] = useState(false);
  const passkeySupported = usePasskeySupport();
  const anchorRef = useRef<HTMLButtonElement>(null);

  async function onSignOut() {
    setOpen(false);
    await signOutUser();
    router.replace("/sign-in");
  }

  async function onAddPasskey() {
    setAddingPasskey(true);
    try {
      await registerPasskey();
      toast({ title: "Passkey added", description: "You can now sign in with Face ID.", variant: "success" });
      setOpen(false);
    } catch (err) {
      toast({ title: "Couldn't add passkey", description: err instanceof AuthError ? err.message : undefined, variant: "error" });
    } finally {
      setAddingPasskey(false);
    }
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
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-[var(--glass-bg-soft)]"
          >
            <Avatar user={user} size={40} />
            <div className="min-w-0">
              <p className="text-strong truncate text-sm font-medium">{user.displayName || "Your account"}</p>
              <p className="text-muted truncate text-xs">{user.email}</p>
            </div>
          </Link>
          <div className="my-1 h-px bg-[var(--glass-border)]" />
          <Link
            href="/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="text-body flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-[var(--glass-bg-soft)] hover:text-[var(--text-strong)]"
          >
            <CircleUserRound className="size-4.5" />
            Your account
          </Link>
          <Link
            href="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="text-body flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-[var(--glass-bg-soft)] hover:text-[var(--text-strong)]"
          >
            <Settings className="size-4.5" />
            Settings
          </Link>
          {passkeySupported && (
            <button
              type="button"
              role="menuitem"
              onClick={onAddPasskey}
              disabled={addingPasskey}
              className="text-body flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-[var(--glass-bg-soft)] hover:text-[var(--text-strong)] disabled:opacity-55"
            >
              <Fingerprint className="size-4.5" />
              {addingPasskey ? "Setting up…" : "Set up Face ID"}
            </button>
          )}
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
