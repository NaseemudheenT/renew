"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Wallet, Receipt, PiggyBank, AlertCircle, Check,
  Bell, ShieldCheck, ArrowRight, Lock, Fingerprint, TrendingUp,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { RenewMark } from "@/components/brand/RenewMark";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { CountrySelect } from "@/components/ui/CountrySelect";
import { LanguageSelect } from "@/components/ui/LanguageSelect";
import { CurrencySelect } from "@/components/ui/CurrencySelect";
import { AnimatedButton } from "@/components/motion";
import { requestBrowserNotify } from "@/lib/notify";
import { registerPasskey, isPasskeySupported } from "@/lib/auth/passkey-client";
import { makePasscodeRecord, isValidPasscode } from "@/lib/security/passcode";
import { setSecurity } from "@/lib/firestore/profile";
import { setActiveWorkspace } from "@/lib/workspace";
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
] as const;

type AccountType = "personal" | "business";

const slide = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
  transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
};

const STEPS = 7;
const onlyDigits = (s: string) => s.replace(/\D/g, "");

export function OnboardingClient({ uid, defaultName }: { uid: string; defaultName: string }) {
  const detected = useMemo(() => detectPrefs(), []);
  const bioSupported = useMemo(() => isPasskeySupported(), []);

  const [step, setStep] = useState(0);
  const [name, setName] = useState(defaultName);
  const [language, setLanguage] = useState(detected.language);
  // Country is a DELIBERATE choice — never silently auto-detected. It drives the
  // currency and all number/date formatting, so the person picks it themselves.
  const [region, setRegion] = useState("");
  const [currency, setCurrency] = useState("");
  const [weekStart, setWeekStart] = useState<WeekStart>(detected.weekStart);
  const [income, setIncome] = useState("");        // declared monthly income (optional)
  const [focus, setFocus] = useState<string[]>([]);
  // Both Personal and Business are always available (switch in the top bar) —
  // we no longer ask at setup. Personal is just the initial active workspace.
  const accountType: AccountType = "personal";
  const [avatar, setAvatar] = useState<string>(AVATARS[0]!.id);
  // Security — an optional iPhone-style PIN + Face ID, set up right here.
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [biometric, setBiometric] = useState(true);
  const [notify, setNotify] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const timezone = detected.timezone;
  const incomeNum = Number(onlyDigits(income));
  const pinReady = pin.length === 0 || (isValidPasscode(pin, "pin") && pin === pinConfirm);

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

  // Required fields per step — advancing is blocked until they're filled.
  function stepValid(s: number): boolean {
    switch (s) {
      case 0: return name.trim().length > 0;
      case 1: return Boolean(region && currency && language);
      case 5: return pinReady;
      case 6: return acceptedLegal;
      default: return true;
    }
  }

  function next() {
    if (step === 0 && !name.trim()) return setError("Please tell us your name.");
    if (step === 1 && !stepValid(1)) return setError("Please choose your language, region and currency.");
    if (step === 5 && !pinReady) {
      return setError(pin.length > 0 && pin !== pinConfirm ? "Your passcodes don't match." : "A passcode is 4–8 digits, or leave it blank to skip.");
    }
    if (!stepValid(step)) return;
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS - 1));
  }

  async function finish() {
    setError(null);
    if (!acceptedLegal) return setError("Please accept the Privacy Policy and Terms to continue.");
    if (!pinReady) return setError("Please finish setting your passcode, or clear it to skip.");
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
          acceptedLegal: true,
          avatar,
          ...(incomeNum > 0 ? { monthlyIncome: incomeNum } : {}),
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Could not save.");
      }
      // Save the app-lock passcode they chose (hashed on-device; the raw PIN
      // never leaves the browser). Non-blocking — a hiccup here shouldn't trap
      // them in setup; they can set it in Settings › Security.
      if (pin.length > 0 && isValidPasscode(pin, "pin")) {
        try {
          const record = await makePasscodeRecord(pin, "pin", biometric && bioSupported);
          await setSecurity(uid, record);
        } catch { /* optional — carry on */ }
      }
      // Set up a passkey NOW (Face ID / device unlock) so next sign-in is one
      // tap — created at first sign-in, never required beforehand. Non-blocking:
      // if the person dismisses the prompt, is on an unsupported browser, or it
      // errors, onboarding still completes and they can add one later in Settings.
      if (bioSupported) {
        try { await registerPasskey(); } catch { /* optional — skip silently */ }
      }
      // Open the app in the workspace they chose here.
      setActiveWorkspace(accountType);
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
            <div className="mb-5 flex flex-col items-center text-center">
              <RenewMark size={56} idSuffix="onboard" />
              <h1 className="text-strong mt-4 text-xl font-medium">Welcome to Renew</h1>
              <p className="text-muted mt-1 text-sm">Your private money, beautifully clear. Let&apos;s set it up — it takes a minute.</p>
            </div>
            <div className="mt-2">
              <Input label="What should we call you?" value={name} autoFocus onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && next()} placeholder="e.g. Alex" />
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="s1" {...slide}>
            <StepHead icon={ShieldCheck} title="Choose your country" sub="This sets your currency and how amounts and dates are shown across Renew. You can change it later in Settings." />
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
            <StepHead icon={TrendingUp} title="About how much comes in?" sub="Roughly what you earn in a typical month. It helps Ren and your advice make sense from day one — no bank details, and you can skip it." />
            <div className="mt-6">
              <label className="text-muted mb-1.5 block text-sm">Monthly income {currency && <span className="text-body">({currency})</span>}</label>
              <div className="flex items-center gap-2 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 focus-within:border-[var(--focus-ring)]">
                {currency && <span className="text-muted shrink-0 text-lg font-medium">{currency}</span>}
                <input
                  value={income ? Number(onlyDigits(income)).toLocaleString() : ""}
                  onChange={(e) => setIncome(onlyDigits(e.target.value))}
                  inputMode="numeric" autoFocus placeholder="0"
                  aria-label="Monthly income"
                  className="text-strong h-14 w-full min-w-0 bg-transparent text-2xl font-light tabular-nums outline-none placeholder:text-[var(--text-muted)]"
                />
              </div>
              <p className="text-muted mt-3 text-xs">Private, like everything in Renew. This is a rough guide, not a promise — your real records always take over once you add them.</p>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="s3" {...slide}>
            <StepHead icon={Wallet} title="What matters most to you?" sub="Pick what you care about — Renew puts these front and centre. You get both Personal and Business, switchable anytime. Change this whenever you like." />
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
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

        {step === 4 && (
          <motion.div key="s4" {...slide}>
            <StepHead title="Pick your look" sub="Your avatar shows your initial on a colour you choose. Change it anytime in Settings." />
            <div className="mt-6 flex justify-center">
              <span className="grid size-20 place-items-center rounded-full text-2xl font-medium text-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)]" style={{ background: AVATARS.find((a) => a.id === avatar)?.css }}>{initials}</span>
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

        {step === 5 && (
          <motion.div key="s5" {...slide}>
            <StepHead icon={Lock} title="Lock Renew with a passcode" sub="An iPhone-style passcode asked when you open Renew — a private lock over your account. Optional, and you can set or change it later in Settings." />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Input label="Passcode (4–8 digits)" value={pin} inputMode="numeric" type="text" autoComplete="off"
                onChange={(e) => setPin(onlyDigits(e.target.value).slice(0, 8))} placeholder="••••" />
              <Input label="Confirm passcode" value={pinConfirm} inputMode="numeric" type="text" autoComplete="off"
                onChange={(e) => setPinConfirm(onlyDigits(e.target.value).slice(0, 8))} placeholder="••••" />
            </div>
            {pin.length > 0 && pinConfirm.length > 0 && pin !== pinConfirm && (
              <p className="mt-2 text-xs text-rose-600 dark:text-rose-300">Passcodes don&apos;t match yet.</p>
            )}
            {bioSupported && (
              <div className="mt-4 flex items-center justify-between rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-3">
                <span className="min-w-0">
                  <span className="text-strong flex items-center gap-2 text-sm font-medium"><Fingerprint className="size-4.5 text-[var(--color-gold-500)]" />Unlock with Face ID / fingerprint</span>
                  <span className="text-muted mt-0.5 block text-xs">Use your device biometrics instead of typing the passcode.</span>
                </span>
                <Switch checked={biometric} onChange={setBiometric} label="Biometric unlock" />
              </div>
            )}
            <p className="text-muted mt-4 flex items-start gap-2 text-xs"><ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[var(--color-gold-500)]" />Your passcode is stored only as a scrambled hash on your own profile — never as the digits you typed.</p>
          </motion.div>
        )}

        {step === 6 && (
          <motion.div key="s6" {...slide}>
            <StepHead icon={Bell} title="Stay in the loop, privately" sub="A couple of choices — you're always in control." />
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

      </AnimatePresence>

      {error && (
        <div role="alert" className="mt-5 flex items-center gap-2 text-sm text-rose-600 dark:text-rose-300"><AlertCircle className="size-4 shrink-0" /><span>{error}</span></div>
      )}

      <div className="mt-7 flex items-center gap-3">
        {step > 0 && (
          <AnimatedButton variant="ghost" onClick={() => { setError(null); setStep((s) => s - 1); }} disabled={submitting}>Back</AnimatedButton>
        )}
        {/* Optional steps offer a quiet Skip so setup never feels forced. */}
        {(step === 2 || step === 5) && (
          <AnimatedButton variant="ghost" onClick={() => { if (step === 5) { setPin(""); setPinConfirm(""); } setError(null); setStep((s) => s + 1); }} disabled={submitting}>Skip</AnimatedButton>
        )}
        {step < STEPS - 1 ? (
          <AnimatedButton size="lg" fullWidth onClick={next} disabled={!stepValid(step)}>Continue</AnimatedButton>
        ) : (
          <AnimatedButton size="lg" fullWidth loading={submitting} onClick={finish} disabled={!acceptedLegal}>
            Enter Renew<ArrowRight className="size-4" />
          </AnimatedButton>
        )}
      </div>
    </GlassCard>
  );
}

/** A calm, consistent step heading — small gold icon badge + title + one line. */
function StepHead({ icon: Icon, title, sub }: { icon?: typeof Wallet; title: string; sub: string }) {
  return (
    <div>
      {Icon && (
        <span className="mb-3 grid size-11 place-items-center rounded-2xl bg-[var(--color-gold-500)]/15">
          <Icon className="size-5 text-[var(--color-gold-500)]" />
        </span>
      )}
      <h1 className="text-strong text-xl font-medium">{title}</h1>
      <p className="text-muted mt-1 text-sm">{sub}</p>
    </div>
  );
}
