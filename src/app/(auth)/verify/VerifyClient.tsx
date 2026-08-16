"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { OtpInput } from "@/components/ui/OtpInput";
import { AnimatedButton, FadeScale, SuccessTransition } from "@/components/motion";
import { requestOtp, submitOtp, signOutUser, AuthError } from "@/lib/auth/client";

type Phase = "input" | "verifying" | "success";

export function VerifyClient({ email }: { email: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<Phase>("input");
  const [error, setError] = useState<string | null>(null);
  // A code is sent on arrival from sign-up, so start the resend cooldown.
  const [cooldown, setCooldown] = useState(30);
  const [resending, setResending] = useState(false);
  const submittedFor = useRef<string>("");

  // Resend cooldown ticker.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function verify(value: string) {
    if (phase === "verifying" || phase === "success") return;
    if (submittedFor.current === value) return;
    submittedFor.current = value;
    setError(null);
    setPhase("verifying");
    try {
      await submitOtp(value);
      setPhase("success");
      setTimeout(() => router.replace("/onboarding"), 1100);
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Verification failed.");
      setPhase("input");
      setCode("");
      submittedFor.current = "";
    }
  }

  async function resend() {
    if (cooldown > 0 || resending) return;
    setError(null);
    setResending(true);
    try {
      await requestOtp();
      setCooldown(30);
      setCode("");
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Could not resend.");
    } finally {
      setResending(false);
    }
  }

  async function useDifferentAccount() {
    await signOutUser();
    router.replace("/sign-in");
  }

  return (
    <FadeScale>
      <GlassCard padded className="text-center">
        <AnimatePresence mode="wait">
          {phase === "success" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-4"
            >
              <SuccessTransition size={84} label="Email verified" />
              <div>
                <h1 className="text-strong text-xl font-medium">Verified</h1>
                <p className="text-muted mt-1 text-sm">Taking you in…</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h1 className="text-strong text-xl font-medium">Verify your email</h1>
              <p className="text-muted mx-auto mt-1 max-w-xs text-sm">
                We sent a 6-digit code to{" "}
                <span className="text-body font-medium">{email || "your email"}</span>.
              </p>

              <div className="mt-7">
                <OtpInput
                  value={code}
                  onChange={setCode}
                  onComplete={verify}
                  disabled={phase === "verifying"}
                  error={Boolean(error)}
                  autoFocus
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="mx-auto mt-4 flex max-w-xs items-center justify-center gap-2 text-sm text-rose-600 dark:text-rose-300"
                >
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="mt-7">
                <AnimatedButton
                  size="lg"
                  fullWidth
                  loading={phase === "verifying"}
                  disabled={code.length !== 6}
                  onClick={() => verify(code)}
                >
                  Verify
                </AnimatedButton>
              </div>

              <div className="text-muted mt-5 text-sm">
                {cooldown > 0 ? (
                  <span>Resend code in {cooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={resend}
                    disabled={resending}
                    className="font-medium text-[var(--color-gold-600)] hover:underline disabled:opacity-60"
                  >
                    {resending ? "Sending…" : "Resend code"}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={useDifferentAccount}
                className="text-muted mt-4 text-xs hover:text-[var(--text-strong)]"
              >
                Use a different account
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </FadeScale>
  );
}
