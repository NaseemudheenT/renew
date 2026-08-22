"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Wallet, Receipt, PiggyBank, TrendingUp, User, Briefcase, Layers, AlertCircle, Check,
  Bell, ShieldCheck, Lock, Fingerprint,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { CountrySelect } from "@/components/ui/CountrySelect";
import { LanguageSelect } from "@/components/ui/LanguageSelect";
import { CurrencySelect } from "@/components/ui/CurrencySelect";
import { AnimatedButton } from "@/components/motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { usePasskeySupport, registerPasskey } from "@/lib/auth/passkey-client";
import { makePasscodeRecord, isValidPasscode, type PasscodeKind } from "@/lib/security/passcode";
import { setSecurity } from "@/lib/firestore/profile";
import { markUnlocked } from "@/components/security/AppLock";
import { requestBrowserNotify } from "@/lib/notify";
import { AVATARS } from "@/lib/avatars";
import {
  detectPrefs, REGION_CURRENCY,
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

const STEPS = 6;

export function OnboardingClient({ defaultName }: { defaultName: string }) {
  const detected = useMemo(() => detectPrefs(), []);
  const { user } = useAuth();
  const passkeySupported = usePasskeySupport();

  const [step, setStep] = useState(0);
  const [name, setName] = useState(defaultName);
  const [language, setLanguage] = useState(detected.language);
  const [region, setRegion] = useState(detected.region);
  const [currency, setCurrency] = useState(detected.currency);
  const [weekStart, setWeekStart] = useState<WeekStart>(detected.weekStart);
  const [focus, setFocus] = useState<string[]>([]);
  const [accountType, setAccountType] = useState<AccountType>("personal");
  const [avatar, setAvatar] = useState<string>(AVATARS[0]!.id);
  const [notify, setNotify] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  // Security
  const [pcKind, setPcKind] = useState<PasscodeKind>("pin");
  const [code, setCode] = useState("");
  const [confirm, setConfirm] = useState("");
  const [biometric, setBiometric] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const timezone = detected.timezone;

  function onRegionChange(next: string) {
    setRegion(next);
    setCurrency(REGION_CURRENCY[next] ?? currency);
    setWeekStart(weekStartFor(next));
  }
  function toggleFocus(id: string) {
    setFocus((p) => (p.includes(id) ? p.filter((f) => f !== id) : [...p, id]));
  }
  async function onToggleNotify(on: boolean) {
    setNotify(on);
    if (on) {
      const status = await requestBrowserNotify();
      setNotify(status === "granted");
    }
  }

  function next() {
    if (step === 0 && !name.trim()) return setError("Please tell us your name.");
    if (step === 4 && !acceptedLegal) return setError("Please accept the Privacy Policy and Terms to continue.");
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS - 1));
  }

  async function finish() {
    setError(null);
    // If a passcode was entered on the security step, validate it.
    if (code.trim()) {
      if (!isValidPasscode(code, pcKind)) return setError(pcKind === "pin" ? "PIN must be 4–8 digits." : "Passphrase must be at least 4 characters.");
      if (code !== confirm) return setError("The two entries don't match.");
    }
    setSubmitting(true);
    try {
      // Save the App Lock first (client-side), so it's ready on next open.
      if (code.trim() && user?.uid) {
        let bio = false;
        if (biometric && passkeySupported) {
          try { await registerPasskey(); bio = true; } catch { bio = false; }
        }
        const record = await makePasscodeRecord(code, pcKind, bio);
        await setSecurity(user.uid, record);
        markUnlocked(user.uid);
      }
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
          acceptedLegal: true,
          avatar,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Could not save.");
      }
      // Full navigation so the server re-reads the freshly-set onboarded flag.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intentional reload to pick up the new session state
      window.location.assign("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  const initials = name.trim().slice(0, 2).toUpperCase() || "R";

  return (
    <GlassCard padded>
      <div className="mb-6 flex items-center gap-1.5" aria-hidden="true">
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
              <Input label="Your name" value={name} autoFocus onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && next()} placeholder="e.g. Alex" />
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="s1" {...slide}>
            <h1 className="text-strong text-xl font-medium">Set your region</h1>
            <p className="text-muted mt-1 text-sm">Auto-detected — change anything. You can update it later in Settings.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <LanguageSelect label="Language" value={language} onChange={setLanguage} locale={language} />
              <CountrySelect label="Country / region" value={region} onChange={onRegionChange} locale={language} />
              <CurrencySelect label="Currency" value={currency} onChange={setCurrency} locale={language} />
              <Select label="Week starts on" value={String(weekStart)} onChange={(e) => setWeekStart(Number(e.target.value) === 1 ? 1 : 0)} options={[{ value: "0", label: "Sunday" }, { value: "1", label: "Monday" }]} />
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
                  <button key={value} type="button" onClick={() => setAccountType(value)} aria-pressed={active}
                    className={cn("flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-sm transition-all", active ? "border-[var(--focus-ring)] bg-[var(--glass-bg-strong)] text-[var(--text-strong)]" : "border-[var(--field-border)] bg-[var(--field-bg)] text-[var(--text-body)] hover:border-[var(--focus-ring)]/50")}>
                    <Icon className="size-5 text-[var(--color-gold-500)]" />{label}
                  </button>
                );
              })}
            </div>
            <p className="text-muted mb-3 mt-6 text-sm">What matters most? <span className="opacity-70">Optional</span></p>
            <div className="grid grid-cols-2 gap-3">
              {FOCUS.map(({ id, label, icon: Icon }) => {
                const active = focus.includes(id);
                return (
                  <button key={id} type="button" onClick={() => toggleFocus(id)} aria-pressed={active}
                    className={cn("relative flex items-center gap-2.5 rounded-2xl border px-3.5 py-3 text-left text-sm transition-all", active ? "border-[var(--focus-ring)] bg-[var(--glass-bg-strong)] text-[var(--text-strong)]" : "border-[var(--field-border)] bg-[var(--field-bg)] text-[var(--text-body)] hover:border-[var(--focus-ring)]/50")}>
                    <Icon className="size-4.5 shrink-0 text-[var(--color-gold-500)]" />
                    <span className="flex-1">{label}</span>
                    <span className={cn("grid size-4 place-items-center rounded-full transition-all", active ? "bg-gradient-to-b from-gold-300 to-gold-500 text-[var(--text-onGold)]" : "opacity-0")}><Check className="size-3" strokeWidth={3} /></span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="s3" {...slide}>
            <h1 className="text-strong text-xl font-medium">Pick your look</h1>
            <p className="text-muted mt-1 text-sm">Choose an avatar — you can change it later in Settings.</p>
            <div className="mt-6 flex justify-center">
              <span className="grid size-20 place-items-center rounded-full text-2xl font-medium text-white" style={{ background: AVATARS.find((a) => a.id === avatar)?.css }}>{initials}</span>
            </div>
            <div className="mt-6 grid grid-cols-4 gap-3 sm:grid-cols-8">
              {AVATARS.map((a) => (
                <button key={a.id} type="button" onClick={() => setAvatar(a.id)} aria-label={a.id} aria-pressed={avatar === a.id}
                  className={cn("size-11 rounded-full ring-2 ring-offset-2 ring-offset-[var(--bg-base)] transition-all", avatar === a.id ? "ring-[var(--focus-ring)]" : "ring-transparent hover:ring-[var(--field-border)]")}
                  style={{ background: a.css }} />
              ))}
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="s4" {...slide}>
            <h1 className="text-strong text-xl font-medium">Stay in the loop, privately</h1>
            <p className="text-muted mt-1 text-sm">A couple of choices — you&apos;re always in control.</p>
            <div className="mt-6 flex items-center justify-between rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-3">
              <span className="min-w-0">
                <span className="text-strong flex items-center gap-2 text-sm font-medium"><Bell className="size-4.5 text-[var(--color-gold-500)]" />Notifications</span>
                <span className="text-muted mt-0.5 block text-xs">Bill reminders and important nudges. No spam.</span>
              </span>
              <Switch checked={notify} onChange={onToggleNotify} label="Notifications" />
            </div>
            <button type="button" onClick={() => setAcceptedLegal((v) => !v)} className="mt-3 flex w-full items-start gap-3 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-3 text-left">
              <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-all", acceptedLegal ? "border-transparent bg-gradient-to-b from-gold-300 to-gold-500 text-[var(--text-onGold)]" : "border-[var(--field-border)]")}>{acceptedLegal && <Check className="size-3.5" strokeWidth={3} />}</span>
              <span className="text-body text-sm">
                I agree to Renew&apos;s{" "}
                <Link href="/privacy" target="_blank" className="text-[var(--color-gold-600)] underline">Privacy Policy</Link>{" "}and{" "}
                <Link href="/terms" target="_blank" className="text-[var(--color-gold-600)] underline">Terms</Link>.
              </span>
            </button>
            <p className="text-muted mt-4 flex items-start gap-2 text-xs"><ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[var(--color-gold-500)]" />Renew hides your balances by default and stores the minimum — your money stays yours.</p>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div key="s5" {...slide}>
            <h1 className="text-strong text-xl font-medium">Lock Renew</h1>
            <p className="text-muted mt-1 text-sm">Set a passcode and Face ID so only you can open Renew. Recommended — you can add it later in Settings too.</p>
            <div className="mt-5 inline-flex rounded-full border border-[var(--field-border)] bg-[var(--field-bg)] p-1 text-sm">
              {(["pin", "text"] as PasscodeKind[]).map((k) => (
                <button key={k} type="button" onClick={() => { setPcKind(k); setCode(""); setConfirm(""); setError(null); }} className={cn("rounded-full px-4 py-1.5 transition-colors", pcKind === k ? "bg-[var(--glass-bg-strong)] text-[var(--text-strong)]" : "text-[var(--text-muted)]")}>{k === "pin" ? "PIN" : "Passphrase"}</button>
              ))}
            </div>
            <div className="mt-4 grid gap-3">
              <Input label={pcKind === "pin" ? "Passcode (4–8 digits)" : "Passphrase"} type="password" inputMode={pcKind === "pin" ? "numeric" : "text"} value={code} onChange={(e) => { setCode(e.target.value); setError(null); }} placeholder={pcKind === "pin" ? "••••" : "At least 4 characters"} />
              <Input label="Confirm" type="password" inputMode={pcKind === "pin" ? "numeric" : "text"} value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(null); }} placeholder="Re-enter" />
              {passkeySupported && (
                <div className="flex items-center justify-between rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-3">
                  <span className="text-body flex items-center gap-2.5 text-sm"><Fingerprint className="size-4.5 text-[var(--color-gold-500)]" />Also unlock with Face ID</span>
                  <Switch checked={biometric} onChange={setBiometric} label="Unlock with Face ID" />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div role="alert" className="mt-5 flex items-center gap-2 text-sm text-rose-600 dark:text-rose-300"><AlertCircle className="size-4 shrink-0" /><span>{error}</span></div>
      )}

      <div className="mt-7 flex items-center gap-3">
        {step > 0 && (
          <AnimatedButton variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={submitting}>Back</AnimatedButton>
        )}
        {step < STEPS - 1 ? (
          <AnimatedButton size="lg" fullWidth onClick={next}>Continue</AnimatedButton>
        ) : (
          <AnimatedButton size="lg" fullWidth loading={submitting} onClick={finish}>
            {code.trim() ? <><Lock className="size-4" />Turn on & enter</> : "Enter Renew"}
          </AnimatedButton>
        )}
      </div>
    </GlassCard>
  );
}
