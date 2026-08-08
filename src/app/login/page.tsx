"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { Atmosphere } from "@/components/atmosphere/live-atmosphere";
import { RenewMark } from "@/components/brand/renew-mark";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { OtpInput } from "@/components/ui/otp-input";
import { SocialAuth } from "@/components/auth/social-auth";
import { useAuth } from "@/components/providers/auth-provider";
import { authErrorMessage } from "@/lib/auth/errors";
import { emailSchema, passwordSchema } from "@/lib/validation/auth";

type Mode = "signin" | "signup";
type View = "credentials" | "otp";
const EASE = [0.22, 1, 0.36, 1] as const;
const RESEND_SECONDS = 30;

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [view, setView] = useState<View>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const [code, setCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    },
    [],
  );

  function startCooldown() {
    setCooldown(RESEND_SECONDS);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1 && cooldownRef.current) clearInterval(cooldownRef.current);
        return Math.max(0, c - 1);
      });
    }, 1000);
  }

  async function sendOtp(target: string) {
    const res = await fetch("/api/auth/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: target }),
    });
    const data = await res.json().catch(() => ({}));
    setDevCode(data?.devCode ?? null);
    startCooldown();
  }

  async function submitCredentials(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const errors: typeof fieldErrors = {};

    const emailCheck = emailSchema.safeParse(email);
    if (!emailCheck.success) errors.email = emailCheck.error.issues[0].message;

    if (mode === "signup") {
      const pwCheck = passwordSchema.safeParse(password);
      if (!pwCheck.success) errors.password = pwCheck.error.issues[0].message;
    } else if (!password) {
      errors.password = "Password is required";
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setLoading(true);
    try {
      if (mode === "signup") {
        await signUp(email.trim(), password);
      } else {
        await signIn(email.trim(), password);
      }
      await sendOtp(email.trim());
      setView("otp");
    } catch (err) {
      setFormError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(value: string) {
    setOtpError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.ok) {
        router.push("/onboarding");
      } else {
        setOtpError(data?.error || "That code isn't right.");
        setCode("");
      }
    } catch {
      setOtpError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-6">
      <Atmosphere />
      <div className="fixed top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      <GlassCard
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="w-full max-w-[400px] p-8 sm:p-10"
      >
        <div className="mb-7 flex flex-col items-center text-center">
          <RenewMark size={56} glow />
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {view === "credentials" ? (
            <motion.div
              key="credentials"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              <h1 className="text-center text-xl font-medium text-[var(--foreground)]">
                {mode === "signin" ? "Welcome back" : "Create your account"}
              </h1>
              <p className="mt-1.5 mb-6 text-center text-sm text-[var(--muted)]">
                {mode === "signin"
                  ? "Sign in to continue to Renew."
                  : "A calmer way to never forget what matters."}
              </p>

              {/* Mode toggle */}
              <div className="mb-6 grid grid-cols-2 rounded-[var(--radius-md)] bg-[var(--surface)] p-1 text-sm">
                {(["signin", "signup"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMode(m);
                      setFieldErrors({});
                      setFormError("");
                    }}
                    className="relative rounded-[calc(var(--radius-md)-4px)] py-2 font-medium transition-colors"
                  >
                    {mode === m && (
                      <motion.span
                        layoutId="mode-pill"
                        className="absolute inset-0 rounded-[calc(var(--radius-md)-4px)] bg-[var(--gold)]"
                        transition={{ duration: 0.3, ease: EASE }}
                      />
                    )}
                    <span
                      className={
                        mode === m
                          ? "relative text-[var(--gold-contrast)]"
                          : "relative text-[var(--muted)]"
                      }
                    >
                      {m === "signin" ? "Sign in" : "Create account"}
                    </span>
                  </button>
                ))}
              </div>

              {/* Social sign-in */}
              <SocialAuth onError={setFormError} disabled={loading} />

              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-[var(--border)]" />
                <span className="text-xs tracking-wide text-[var(--subtle)]">or with email</span>
                <span className="h-px flex-1 bg-[var(--border)]" />
              </div>

              <form onSubmit={submitCredentials} className="flex flex-col gap-4" noValidate>
                <Input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  label="Email"
                  icon={Mail}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={fieldErrors.email}
                />
                <Input
                  name="password"
                  type="password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  placeholder={mode === "signin" ? "Your password" : "Create a strong password"}
                  label="Password"
                  icon={Lock}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={fieldErrors.password}
                />

                {formError && (
                  <p className="text-center text-sm text-[var(--danger)]">{formError}</p>
                )}

                <Button type="submit" size="lg" loading={loading} fullWidth className="mt-2">
                  {!loading && (
                    <>
                      Continue <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              <h1 className="text-center text-xl font-medium text-[var(--foreground)]">
                Check your email
              </h1>
              <p className="mt-1.5 mb-7 text-center text-sm text-[var(--muted)]">
                We sent a 6-digit code to
                <br />
                <span className="text-[var(--foreground)]">{email}</span>
              </p>

              <OtpInput
                value={code}
                onChange={setCode}
                onComplete={verifyOtp}
                error={!!otpError}
                autoFocus
                disabled={loading}
              />

              {otpError && (
                <p className="mt-4 text-center text-sm text-[var(--danger)]">{otpError}</p>
              )}

              {devCode && (
                <p className="mt-4 text-center text-xs text-[var(--subtle)]">
                  Dev: email not delivered — your code is{" "}
                  <span className="font-mono text-[var(--gold)]">{devCode}</span>
                </p>
              )}

              <Button
                type="button"
                size="lg"
                loading={loading}
                fullWidth
                className="mt-6"
                onClick={() => verifyOtp(code)}
                disabled={code.length !== 6}
              >
                {!loading && "Verify"}
              </Button>

              <div className="mt-5 flex items-center justify-center gap-4 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setView("credentials");
                    setCode("");
                    setOtpError("");
                  }}
                  className="text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
                >
                  Back
                </button>
                <span className="text-[var(--border-strong)]">·</span>
                <button
                  type="button"
                  disabled={cooldown > 0}
                  onClick={() => sendOtp(email.trim())}
                  className="text-[var(--muted)] transition-colors hover:text-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </main>
  );
}
