"use client";

import Image from "next/image";
import { useState } from "react";
import { initialsOf, type ShellUser } from "./shell-types";
import { useUserProfile } from "@/hooks/useUserProfile";
import { avatarGradient } from "@/lib/avatars";
import { cn } from "@/lib/utils";

export function Avatar({ user, size = 36, className }: { user: ShellUser; size?: number; className?: string }) {
  const [broken, setBroken] = useState(false);
  const { profile } = useUserProfile();
  const showImage = user.photoURL && !broken;
  const gradient = avatarGradient(profile?.avatar);
  return (
    <span
      className={cn(
        "grid place-items-center overflow-hidden rounded-full bg-gradient-to-br from-gold-200 to-gold-400 text-white font-medium select-none",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.4, ...(gradient && !showImage ? { background: gradient } : {}) }}
      aria-hidden="true"
    >
      {showImage ? (
        <Image
          src={user.photoURL!}
          alt=""
          width={size}
          height={size}
          className="size-full object-cover"
          onError={() => setBroken(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        initialsOf(user)
      )}
    </span>
  );
}
