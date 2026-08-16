"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { FadeScale } from "@/components/motion";
import { GoogleIcon } from "@/components/brand/GoogleIcon";
import { AppleIcon } from "@/components/brand/AppleIcon";
import { SetupNotice } from "@/components/auth/SetupNotice";
import { signInWithGoogle, signInWithApple, AuthError } from "@/lib/auth/client";

export default function SignInPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const busy = googleLoading || appleLoading;

  async function onGoogle() {
    setFormError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.replace("/dashboard"); // guards route to onboarding as needed
    } catch (err) {
      setFormError(err instanceof AuthError ? err.message : "Something went wrong.");
      setGoogleLoading(false);
    }
  }

  async function onApple() {
    setFormError(null);
    setAppleLoading(true);
    try {
      await signInWithApple();
      router.replace("/dashboard");
    } catch (err) {
      setFormError(err instanceof AuthError ? err.message : "Something went wrong.");
      setAppleLoading(false);
    }
  }

  return (
    <FadeScale>
      <GlassCard padded>
        <h1 className="text-strong text-xl font-medium">Welcome back</h1>
        <p className="text-muted mt-1 mb-4 text-sm">
          Sign in to pick up where you left off.
        </p>
        <SetupNotice />

        {formError && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-300"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onGoogle}
            disabled={busy}
            className="glass !rounded-full flex h-12 w-full items-center justify-center gap-3 text-[0.95rem] font-medium text-[var(--text-strong)] transition-all hover:-translate-y-px disabled:opacity-55"
          >
            <GoogleIcon className="size-5" />
            {googleLoading ? "Connecting…" : "Continue with Google"}
          </button>

          <button
            type="button"
            onClick={onApple}
            disabled={busy}
            className="glass !rounded-full flex h-12 w-full items-center justify-center gap-2.5 text-[0.95rem] font-medium text-[var(--text-strong)] transition-all hover:-translate-y-px disabled:opacity-55"
          >
            <AppleIcon className="size-[1.15rem]" />
            {appleLoading ? "Connecting…" : "Continue with Apple"}
          </button>
        </div>

        <p className="text-muted mt-6 text-center text-sm">
          New to Renew?{" "}
          <Link href="/sign-up" className="font-medium text-[var(--color-gold-600)] hover:underline">
            Create an account
          </Link>
        </p>
      </GlassCard>
    </FadeScale>
  );
}
