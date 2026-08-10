"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { authErrorCode, authErrorMessage } from "@/lib/auth/errors";
import { cn } from "@/lib/utils";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5h-1.9V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 1 1 8-21l5.7-5.7A20 20 0 1 0 24 44a20 20 0 0 0 19.6-23.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8A12 12 0 0 1 24 12c3 0 5.8 1.2 8 3l5.7-5.7A20 20 0 0 0 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0 1 12.7 28l-6.6 5.1A20 20 0 0 0 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C39.9 34.9 44 28.5 44 24c0-1.2-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.37 12.78c.03 3.02 2.65 4.02 2.68 4.03-.02.07-.42 1.43-1.38 2.84-.83 1.22-1.7 2.44-3.06 2.46-1.34.03-1.77-.79-3.3-.79-1.53 0-2.01.77-3.28.82-1.32.05-2.32-1.32-3.16-2.53-1.71-2.48-3.02-7.02-1.26-10.08.87-1.52 2.43-2.48 4.12-2.51 1.3-.02 2.52.87 3.31.87.79 0 2.28-1.08 3.84-.92.65.03 2.49.26 3.67 1.99-.1.06-2.19 1.28-2.17 3.82zM13.9 4.6c.7-.85 1.17-2.03 1.04-3.2-1 .04-2.22.67-2.94 1.51-.65.75-1.21 1.95-1.06 3.1 1.12.08 2.26-.57 2.96-1.41z" />
    </svg>
  );
}

/** "Continue with Google / Apple" — OAuth via Firebase popup, then onboarding. */
export function SocialAuth({
  onError,
  disabled,
}: {
  onError: (msg: string) => void;
  disabled?: boolean;
}) {
  const router = useRouter();
  const { signInWithGoogle, signInWithApple } = useAuth();
  const [busy, setBusy] = useState<"google" | "apple" | null>(null);

  async function run(which: "google" | "apple", fn: () => Promise<unknown>) {
    if (busy) return;
    setBusy(which);
    onError("");
    try {
      await fn();
      router.push("/dashboard");
    } catch (err) {
      const code = authErrorCode(err);
      // User simply closed the popup — not an error worth surfacing.
      if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        onError(authErrorMessage(err));
      }
    } finally {
      setBusy(null);
    }
  }

  const base =
    "inline-flex h-12 w-full items-center justify-center gap-3 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface)] text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-hover)] hover:border-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        disabled={disabled || !!busy}
        onClick={() => run("google", signInWithGoogle)}
        className={cn(base)}
      >
        {busy === "google" ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />}
        Continue with Google
      </button>
      <button
        type="button"
        disabled={disabled || !!busy}
        onClick={() => run("apple", signInWithApple)}
        className={cn(base)}
      >
        {busy === "apple" ? <Loader2 className="size-4 animate-spin" /> : <AppleIcon />}
        Continue with Apple
      </button>
    </div>
  );
}
