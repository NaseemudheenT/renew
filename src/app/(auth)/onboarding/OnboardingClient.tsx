"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Wallet, Receipt, PiggyBank, TrendingUp, User, Briefcase, Layers, AlertCircle, Check,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { AnimatedButton } from "@/components/motion";
import {
  detectPrefs, LANGUAGES, REGIONS, CURRENCY_CODES, REGION_CURRENCY,
  weekStartFor, hour12For, type WeekStart,
} from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

const FOCUS = [
  { id: "spending", label: "Spending & budgets", icon: Wallet },
  { id: "bills", label: "Bills & subscriptions", icon: Receipt },
  { id: "savings", label: "Savings goals", icon: PiggyBank },
  { id: "investments", label: "Investments", icon: TrendingUp },
] as const;

type AccountType = "personal" | "business" | "both";
const ACCOUNT_TYPES = [
  { value: "personal", label: "Personal", icon: User },
  { value: "business", label: "Business", icon: Briefcase },
  { value: "both", label: "Both", icon: Layers },
] as const;

const slide = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
  transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
};

const STEPS = 3;

export function OnboardingClient({ defaultName }: { defaultName: string }) {
  const router = useRouter();
  const detected = useMemo(() => detectPrefs(), []);
  const [step, setStep] = useState(0);
  const [name, setName] = useState(defaultName);
  const [language, setLanguage] = useState(detected.language);
  const [region, setRegion] = useState(detected.region);
  const [currency, setCurrency] = useState(detected.currency);
  const [weekStart, setWeekStart] = useState<WeekStart>(detected.weekStart);
  const [focus, setFocus] = useState<string[]>([]);
  const [accountType, setAccountType] = useState<AccountType>("personal");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const timezone = detected.timezone;

  function onRegionChange(next: string) {
    setRegion(next);
    setCurrency(REGION_CURRENCY[next] ?? currency);
    setWeekStart(weekStartFor(next));
  }
  function toggle(id: string) {
    setFocus((p) => (p.includes(id) ? p.filter((f) => f !== id) : [...p, id]));
  }
  function next() {
    if (step === 0 && !name.trim()) {
      setError("Please tell us your name.");
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS - 1));
  }
  async function finish() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: name.trim(),
          timezone,
          focus,
          locale: language,
          region,
          currency,
          weekStart,
          hour12: hour12For(region),
          accountType,
        }),
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
        {Array.from({ length: STEPS }, (_, i) => (
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
        {step === 0 && (
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
        )}
        {step === 1 && (
          <motion.div key="s1" {...slide}>
            <h1 className="text-strong text-xl font-medium">Set your region</h1>
            <p className="text-muted mt-1 text-sm">Auto-detected from your device — change anything. You can update it later in Settings.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Select
                label="Language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                options={LANGUAGES.map((l) => ({ value: l.code, label: `${l.native} · ${l.label}` }))}
              />
              <Select
                label="Country / region"
                value={region}
                onChange={(e) => onRegionChange(e.target.value)}
                options={REGIONS.map((r) => ({ value: r.code, label: r.label }))}
              />
              <Select
                label="Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                options={CURRENCY_CODES.map((c) => ({ value: c, label: c }))}
              />
              <Select
                label="Week starts on"
                value={String(weekStart)}
                onChange={(e) => setWeekStart(Number(e.target.value) === 1 ? 1 : 0)}
                options={[{ value: "0", label: "Sunday" }, { value: "1", label: "Monday" }]}
              />
            </div>
          </motion.div>
        )}
        {step === 2 && (
          <motion.div key="s2" {...slide}>
            <h1 className="text-strong text-xl font-medium">How will you use Renew?</h1>
            <p className="text-muted mt-1 text-sm">You can change this anytime in Settings.</p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {ACCOUNT_TYPES.map(({ value, label, icon: Icon }) => {
                const active = accountType === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAccountType(value)}
                    aria-pressed={active}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-sm transition-all",
                      active
                        ? "border-[var(--focus-ring)] bg-[var(--glass-bg-strong)] text-[var(--text-strong)]"
                        : "border-[var(--field-border)] bg-[var(--field-bg)] text-[var(--text-body)] hover:border-[var(--focus-ring)]/50",
                    )}
                  >
                    <Icon className="size-5 text-[var(--color-gold-500)]" />
                    {label}
                  </button>
                );
              })}
            </div>

            <p className="text-muted mb-3 mt-6 text-sm">What matters most? <span className="opacity-70">Optional</span></p>
            <div className="grid grid-cols-2 gap-3">
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
        {step > 0 && (
          <AnimatedButton variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={submitting}>
            Back
          </AnimatedButton>
        )}
        {step < STEPS - 1 ? (
          <AnimatedButton size="lg" fullWidth onClick={next}>Continue</AnimatedButton>
        ) : (
          <AnimatedButton size="lg" fullWidth loading={submitting} onClick={finish}>Enter Renew</AnimatedButton>
        )}
      </div>
    </GlassCard>
  );
}
