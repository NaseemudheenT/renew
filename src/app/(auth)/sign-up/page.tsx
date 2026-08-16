"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { User as UserIcon, Mail, Lock, AlertCircle } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";
import { AnimatedButton } from "@/components/motion";
import { GoogleIcon } from "@/components/brand/GoogleIcon";
import { SetupNotice } from "@/components/auth/SetupNotice";
import { FadeScale } from "@/components/motion";
import {
  signUpWithEmail,
  signInWithGoogle,
  requestOtp,
  AuthError,
} from "@/lib/auth/client";

interface FormValues {
  name: string;
  email: string;
  password: string;
}

export default function SignUpPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ mode: "onTouched" });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      await signUpWithEmail(values);
      await requestOtp().catch(() => {}); // send first code; verify page can resend
      router.replace("/verify");
    } catch (err) {
      setFormError(err instanceof AuthError ? err.message : "Something went wrong.");
    }
  }

  async function onGoogle() {
    setFormError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.replace("/onboarding");
    } catch (err) {
      setFormError(err instanceof AuthError ? err.message : "Something went wrong.");
      setGoogleLoading(false);
    }
  }

  return (
    <FadeScale>
      <GlassCard padded>
        <h1 className="text-strong text-xl font-medium">Create your account</h1>
        <p className="text-muted mt-1 mb-4 text-sm">
          Start keeping life&apos;s renewals in one calm place.
        </p>
        <SetupNotice />

        {formError && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-2 rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-300"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{formError}</span>
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
            label="Name"
            autoComplete="name"
            icon={<UserIcon className="size-4.5" />}
            error={errors.name?.message}
            {...register("name", {
              required: "Please enter your name.",
              minLength: { value: 1, message: "Please enter your name." },
            })}
          />
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
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            icon={<Lock className="size-4.5" />}
            hint="At least 6 characters."
            error={errors.password?.message}
            {...register("password", {
              required: "Choose a password.",
              minLength: { value: 6, message: "Use at least 6 characters." },
            })}
          />
          <AnimatedButton type="submit" size="lg" fullWidth loading={isSubmitting}>
            Create account
          </AnimatedButton>
        </form>

        <p className="text-muted mt-5 text-center text-sm">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-[var(--color-gold-600)] hover:underline">
            Sign in
          </Link>
        </p>
      </GlassCard>
    </FadeScale>
  );
}
