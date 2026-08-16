"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Mail, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";
import { AnimatedButton, FadeScale } from "@/components/motion";
import { GoogleIcon } from "@/components/brand/GoogleIcon";
import {
  signInWithEmail,
  signInWithGoogle,
  resetPassword,
  AuthError,
} from "@/lib/auth/client";

interface FormValues {
  email: string;
  password: string;
}

export default function SignInPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ mode: "onTouched" });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    setNotice(null);
    try {
      await signInWithEmail(values);
      router.replace("/dashboard"); // guards route to verify/onboarding as needed
    } catch (err) {
      setFormError(err instanceof AuthError ? err.message : "Something went wrong.");
    }
  }

  async function onGoogle() {
    setFormError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.replace("/dashboard");
    } catch (err) {
      setFormError(err instanceof AuthError ? err.message : "Something went wrong.");
      setGoogleLoading(false);
    }
  }

  async function onForgot() {
    setFormError(null);
    setNotice(null);
    const email = getValues("email");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Enter your email above, then tap Forgot password.");
      return;
    }
    try {
      await resetPassword(email);
      setNotice("If an account exists, a reset link is on its way.");
    } catch {
      setNotice("If an account exists, a reset link is on its way.");
    }
  }

  return (
    <FadeScale>
      <GlassCard padded>
        <h1 className="text-strong text-xl font-medium">Welcome back</h1>
        <p className="text-muted mt-1 text-sm">Sign in to pick up where you left off.</p>

        {formError && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-2 rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-300"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}
        {notice && (
          <div className="mt-5 flex items-start gap-2 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        <button
          type="button"
          onClick={onGoogle}
          disabled={googleLoading || isSubmitting}
          className="glass !rounded-full mt-5 flex h-11 w-full items-center justify-center gap-3 text-[0.95rem] font-medium text-[var(--text-strong)] transition-all hover:-translate-y-px disabled:opacity-55"
        >
          <GoogleIcon className="size-5" />
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-[var(--text-muted)]">
          <span className="h-px flex-1 bg-[var(--glass-border)]" />
          or
          <span className="h-px flex-1 bg-[var(--glass-border)]" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            icon={<Mail className="size-4.5" />}
            error={errors.email?.message}
            {...register("email", {
              required: "Please enter your email.",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "That doesn't look like a valid email.",
              },
            })}
          />
          <div>
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              icon={<Lock className="size-4.5" />}
              error={errors.password?.message}
              {...register("password", { required: "Please enter your password." })}
            />
            <button
              type="button"
              onClick={onForgot}
              className="text-muted mt-2 text-sm hover:text-[var(--text-strong)]"
            >
              Forgot password?
            </button>
          </div>
          <AnimatedButton type="submit" size="lg" fullWidth loading={isSubmitting}>
            Sign in
          </AnimatedButton>
        </form>

        <p className="text-muted mt-5 text-center text-sm">
          New to Renew?{" "}
          <Link href="/sign-up" className="font-medium text-[var(--color-gold-600)] hover:underline">
            Create an account
          </Link>
        </p>
      </GlassCard>
    </FadeScale>
  );
}
