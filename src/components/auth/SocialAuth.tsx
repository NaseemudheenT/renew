"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/liquid-glass";
import { FadeScale } from "@/components/motion";
import { GoogleIcon } from "@/components/brand/GoogleIcon";
import { AppleIcon } from "@/components/brand/AppleIcon";
import { useAuth } from "@/components/providers/AuthProvider";
import { signInWithGoogle, signInWithApple, AuthError } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

/**
 * Shared Google + Apple liquid-glass auth. The OTP/session/onboarding backend is
 * unchanged — this only drives the client sign-in and hands off to the guards.
 */
export function SocialAuth({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  const router = useRouter();
  const { configured } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<null | "google" | "apple">(null);

  async function run(kind: "google" | "apple") {
    setError(null);
    setPending(kind);
    try {
      await (kind === "google" ? signInWithGoogle() : signInWithApple());
      router.replace("/dashboard"); // guards route to verify/onboarding as needed
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Something went wrong.");
      setPending(null);
    }
  }

  return (
    <FadeScale>
      <GlassCard padded>
        <h1 className="text-strong text-xl font-medium">{title}</h1>
        <p className="text-muted mt-1 mb-5 text-sm">{subtitle}</p>

        {!configured && (
          <div className="mb-4 flex items-start gap-2 rounded-2xl border border-[var(--field-border)] bg-[var(--glass-bg-soft)] px-4 py-3 text-sm text-[var(--text-body)]">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-[var(--color-gold-500)]" />
            <span>Connect Firebase to sign in — add your project keys (see README).</span>
          </div>
        )}
        {error && (
          <div role="alert" className="mb-4 flex items-start gap-2 rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-300">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <SocialButton
            onClick={() => run("google")}
            disabled={pending !== null}
            loading={pending === "google"}
            icon={<GoogleIcon className="size-5" />}
            label="Continue with Google"
          />
          <SocialButton
            onClick={() => run("apple")}
            disabled={pending !== null}
            loading={pending === "apple"}
            icon={<AppleIcon className="size-[1.15rem]" />}
            label="Continue with Apple"
          />
        </div>
      </GlassCard>
    </FadeScale>
  );
}

function SocialButton({
  onClick,
  disabled,
  loading,
  icon,
  label,
}: {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <GlassButton
      type="button"
      variant="neutral"
      fullWidth
      onClick={onClick}
      disabled={disabled}
      className={cn("h-12 gap-2.5 text-[0.95rem] font-medium")}
    >
      {icon}
      {loading ? "Connecting…" : label}
    </GlassButton>
  );
}
