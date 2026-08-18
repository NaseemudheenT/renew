"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Lock, Mail, User2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/liquid-glass";
import { Input } from "@/components/ui/Input";
import { FadeScale } from "@/components/motion";
import { GoogleIcon } from "@/components/brand/GoogleIcon";
import { AppleIcon } from "@/components/brand/AppleIcon";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  signInWithGoogle,
  signInWithApple,
  signInWithEmail,
  signUpWithEmail,
  resetPassword,
  AuthError,
} from "@/lib/auth/client";
import { cn } from "@/lib/utils";

type Mode = "sign-in" | "sign-up";
type Pending = null | "google" | "apple" | "email";

/**
 * Renew's real, working auth surface — email + password with Continue-with-Google
 * and Continue-with-Apple, in one calm liquid-glass card. `mode` decides whether
 * we create an account (name field) or sign in (forgot-password link). Every path
 * mints the httpOnly session then hands off to the route guards.
 */
export function SocialAuth({
  title,
  subtitle,
  mode = "sign-in",
}: {
  title: string;
  subtitle: string;
  mode?: Mode;
}) {
  const router = useRouter();
  const { configured } = useAuth();
  const isSignUp = mode === "sign-up";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>(null);

  function fail(err: unknown) {
    setError(err instanceof AuthError ? err.message : "Something went wrong.");
    setPending(null);
  }

  async function social(kind: "google" | "apple") {
    setError(null);
    setNotice(null);
    setPending(kind);
    try {
      await (kind === "google" ? signInWithGoogle() : signInWithApple());
      router.replace("/dashboard");
    } catch (err) {
      fail(err);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setPending("email");
    try {
      if (isSignUp) {
        await signUpWithEmail({ name, email, password });
      } else {
        await signInWithEmail({ email, password });
      }
      router.replace("/dashboard");
    } catch (err) {
      fail(err);
    }
  }

  async function onForgot() {
    setError(null);
    setNotice(null);
    if (!email.trim()) {
      setError("Enter your email above, then tap “Forgot password”.");
      return;
    }
    try {
      await resetPassword(email.trim());
      setNotice("Password reset link sent — check your inbox.");
    } catch (err) {
      fail(err);
    }
  }

  const busy = pending !== null;

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
        {notice && (
          <div role="status" className="mb-4 flex items-start gap-2 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-300">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
          {isSignUp && (
            <Input
              label="Name"
              type="text"
              autoComplete="name"
              placeholder="Your name"
              icon={<User2 className="size-4.5" />}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={busy}
            />
          )}
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            icon={<Mail className="size-4.5" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={busy}
          />
          <Input
            label="Password"
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            placeholder={isSignUp ? "At least 6 characters" : "Your password"}
            icon={<Lock className="size-4.5" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            disabled={busy}
          />

          {!isSignUp && (
            <button
              type="button"
              onClick={onForgot}
              disabled={busy}
              className="-mt-1 self-end text-sm font-medium text-[var(--color-gold-600)] hover:underline disabled:opacity-55"
            >
              Forgot password?
            </button>
          )}

          <GlassButton
            type="submit"
            variant="primary"
            fullWidth
            disabled={busy}
            className="mt-1 h-12 text-[0.95rem] font-semibold"
          >
            {pending === "email"
              ? isSignUp
                ? "Creating account…"
                : "Signing in…"
              : isSignUp
                ? "Create account"
                : "Sign in"}
          </GlassButton>
        </form>

        <div className="my-5 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-[var(--glass-border)]" />
          <span className="text-xs uppercase tracking-wider text-[var(--text-muted)]">or</span>
          <span className="h-px flex-1 bg-[var(--glass-border)]" />
        </div>

        <div className="flex flex-col gap-3">
          <SocialButton
            onClick={() => social("google")}
            disabled={busy}
            loading={pending === "google"}
            icon={<GoogleIcon className="size-5" />}
            label="Continue with Google"
          />
          <SocialButton
            onClick={() => social("apple")}
            disabled={busy}
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
