"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Shield, FileText, CreditCard, Receipt, IdCard, HeartPulse, Car, Home, AlertCircle, Check,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";
import { AnimatedButton } from "@/components/motion";
import { cn } from "@/lib/utils";

const FOCUS = [
  { id: "insurance", label: "Insurance", icon: Shield },
  { id: "documents", label: "Documents & IDs", icon: IdCard },
  { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
  { id: "bills", label: "Bills", icon: Receipt },
  { id: "licenses", label: "Licenses", icon: FileText },
  { id: "vehicle", label: "Vehicle", icon: Car },
  { id: "health", label: "Health", icon: HeartPulse },
  { id: "home", label: "Home", icon: Home },
] as const;

const slide = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
  transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
};

export function OnboardingClient({ defaultName }: { defaultName: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(defaultName);
  const [focus, setFocus] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const timezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  }, []);

  function toggle(id: string) {
    setFocus((p) => (p.includes(id) ? p.filter((f) => f !== id) : [...p, id]));
  }
  function next() {
    if (step === 0 && !name.trim()) {
      setError("Please tell us your name.");
      return;
    }
    setError(null);
    setStep(1);
  }
  async function finish() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name.trim(), timezone, focus }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Could not save.");
      }
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <GlassCard padded>
      <div className="mb-6 flex items-center gap-2" aria-hidden="true">
        {[0, 1].map((i) => (
          <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--glass-bg-soft)]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-gold-300 to-gold-500"
              initial={false}
              animate={{ width: step >= i ? "100%" : "0%" }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {step === 0 ? (
          <motion.div key="s0" {...slide}>
            <h1 className="text-strong text-xl font-medium">Welcome to Renew</h1>
            <p className="text-muted mt-1 text-sm">First, what should we call you?</p>
            <div className="mt-6">
              <Input
                label="Your name"
                value={name}
                autoFocus
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && next()}
                placeholder="e.g. Alex"
              />
            </div>
          </motion.div>
        ) : (
          <motion.div key="s1" {...slide}>
            <h1 className="text-strong text-xl font-medium">What would you like to stay on top of?</h1>
            <p className="text-muted mt-1 text-sm">Optional — pick a few. You can change these anytime.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {FOCUS.map(({ id, label, icon: Icon }) => {
                const active = focus.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggle(id)}
                    aria-pressed={active}
                    className={cn(
                      "relative flex items-center gap-2.5 rounded-2xl border px-3.5 py-3 text-left text-sm transition-all",
                      active
                        ? "border-[var(--focus-ring)] bg-[var(--glass-bg-strong)] text-[var(--text-strong)]"
                        : "border-[var(--field-border)] bg-[var(--field-bg)] text-[var(--text-body)] hover:border-[var(--focus-ring)]/50",
                    )}
                  >
                    <Icon className="size-4.5 shrink-0 text-[var(--color-gold-500)]" />
                    <span className="flex-1">{label}</span>
                    <span className={cn("grid size-4 place-items-center rounded-full transition-all", active ? "bg-gradient-to-b from-gold-300 to-gold-500 text-[var(--text-onGold)]" : "opacity-0")}>
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div role="alert" className="mt-5 flex items-center gap-2 text-sm text-rose-600 dark:text-rose-300">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-7 flex items-center gap-3">
        {step === 1 && (
          <AnimatedButton variant="ghost" onClick={() => setStep(0)} disabled={submitting}>
            Back
          </AnimatedButton>
        )}
        {step === 0 ? (
          <AnimatedButton size="lg" fullWidth onClick={next}>Continue</AnimatedButton>
        ) : (
          <AnimatedButton size="lg" fullWidth loading={submitting} onClick={finish}>Enter Renew</AnimatedButton>
        )}
      </div>
    </GlassCard>
  );
}
