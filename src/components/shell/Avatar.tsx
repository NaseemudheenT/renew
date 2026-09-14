"use client";

import { initialsOf, type ShellUser } from "./shell-types";
import { useUserProfile } from "@/hooks/useUserProfile";
import { avatarGradient, AVATARS } from "@/lib/avatars";
import { cn } from "@/lib/utils";

const DEFAULT_AVATAR = AVATARS[0]!.css; // clean graphite when none chosen

/**
 * The avatar is the person's initial on a refined, premium tone (see lib/avatars
 * / setup "Make it yours") — clean and professional, Apple-style. Renew never
 * pulls a Google photo. Simple, private, consistent.
 */
export function Avatar({ user, size = 36, className }: { user: ShellUser; size?: number; className?: string }) {
  const { profile } = useUserProfile();
  const background = avatarGradient(profile?.avatar) ?? DEFAULT_AVATAR;
  // Prefer the profile name (set at onboarding) over the auth user's, so the
  // initial is real — never a stray "R" when only the profile has the name.
  const initials = initialsOf(profile?.displayName ? { ...user, displayName: profile.displayName } : user);
  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold text-white shadow-[0_1px_4px_-1px_rgba(0,0,0,0.4)] ring-1 ring-white/10 select-none",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.4, background }}
      aria-hidden="true"
    >
      {/* A whisper of top-light — refined, not glossy. */}
      <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_34%_26%,rgba(255,255,255,0.22),transparent_60%)]" />
      <span className="relative">{initials}</span>
    </span>
  );
}
