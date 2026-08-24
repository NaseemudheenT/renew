"use client";

import { initialsOf, type ShellUser } from "./shell-types";
import { useUserProfile } from "@/hooks/useUserProfile";
import { avatarGradient } from "@/lib/avatars";
import { cn } from "@/lib/utils";

/**
 * The avatar is always the person's initial on their chosen colour "aura" (see
 * lib/avatars / the setup "Pick your look" step) — Renew never pulls a Google
 * profile photo. Simple, private, consistent.
 */
export function Avatar({ user, size = 36, className }: { user: ShellUser; size?: number; className?: string }) {
  const { profile } = useUserProfile();
  const gradient = avatarGradient(profile?.avatar);
  return (
    <span
      className={cn(
        "grid place-items-center overflow-hidden rounded-full bg-gradient-to-br from-gold-300 to-gold-500 font-medium text-white select-none",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.4, ...(gradient ? { background: gradient } : {}) }}
      aria-hidden="true"
    >
      {initialsOf(user)}
    </span>
  );
}
