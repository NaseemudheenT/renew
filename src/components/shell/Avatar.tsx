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
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-gold-300 to-gold-500 font-semibold text-white shadow-[0_2px_10px_-3px_rgba(0,0,0,0.45)] ring-1 ring-white/15 select-none",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.4, ...(gradient ? { background: gradient } : {}) }}
      aria-hidden="true"
    >
      {/* Glossy top-light for a premium, dimensional finish. */}
      <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_32%_24%,rgba(255,255,255,0.5),transparent_58%)]" />
      <span className="relative drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]">{initialsOf(user)}</span>
    </span>
  );
}
