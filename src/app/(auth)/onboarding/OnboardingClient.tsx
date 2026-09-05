"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Wallet, Receipt, PiggyBank, AlertCircle, Check,
  Bell, ShieldCheck, ArrowRight, Lock, Fingerprint,
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
import { PinPad } from "@/components/security/PinPad";
import { requestBrowserNotify } from "@/lib/notify";
import { registerPasskey, isPasskeySupported } from "@/lib/auth/passkey-client";
import { makePasscodeRecord, faceOnlyRecord } from "@/lib/security/passcode";
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
type LockMethod = "pin" | "face";

const slide = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
  transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
};

const STEPS = 6;

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
  const [focus, setFocus] = useState<string[]>([]);
  // Both Personal and Business are always available (switch in the top bar) —
  // we no longer ask at setup. Personal is just the initial active workspace.
  const accountType: AccountType = "personal";
  const [avatar, setAvatar] = useState<string>(AVATARS[0]!.id);
  // Security — MANDATORY. Either a 4-digit passcode or Face ID only.
  const [lockMethod, setLockMethod] = useState<LockMethod>("pin");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinStage, setPinStage] = useState<"enter" | "confirm">("enter");
  const [pinShake, setPinShake] = useState(0);
  const [biometric, setBiometric] = useState(true);
  const [faceReady, setFaceReady] = useState(false);
  const [faceBusy, setFaceBusy] = useState(false);
  const [notify, setNotify] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const timezone = detected.timezone;
  const pinDone = pin.length === 4 && pinConfirm === pin;
  const lockReady = lockMethod === "pin" ? pinDone : faceReady;

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

  // The passcode-creation flow: enter four digits, then re-enter to confirm.
  function onPinComplete(code: string) {
    if (pinStage === "enter") { setPinStage("confirm"); return; }
    if (code === pin) return; // matches → lockReady becomes true
    setPin(""); setPinConfirm(""); setPinStage("enter"); setPinShake((s) => s + 1);
    setError("Those didn't match — let's try again.");
  }
  async function setupFace() {
    setError(null); setFaceBusy(true);
    try { await registerPasskey(); setFaceReady(true); }
    catch { setError("Face ID setup was cancelled or isn't available on this device."); }
    finally { setFaceBusy(false); }
  }

  function stepValid(s: number): boolean {
    switch (s) {
      case 0: return name.trim().length > 0;
      case 1: return Boolean(region && currency && language);
      case 4: return lockReady;
      case 5: return acceptedLegal;
      default: return true;
    }
  }

  function next() {
    if (step === 0 && !name.trim()) return setError("Please tell us your name.");
    if (step === 1 && !stepValid(1)) return setError("Please choose your language, region and currency.");
    if (step === 4 && !lockReady) return setError(lockMethod === "pin" ? "Please set and confirm your 4-digit passcode." : "Please set up Face ID to continue.");
    if (!stepValid(step)) return;
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS - 1));
  }

  async function finish() {
    setError(null);
    if (!acceptedLegal) return setError("Please accept the Privacy Policy and Terms to continue.");
    if (!lockReady) { setStep(4); return setError("Please set your passcode or Face ID — it's required."); }
    setSubmitting(true);
    try {
      // Save the mandatory app lock FIRST — it's required, so a failure here must
      // stop us (the raw PIN is hashed on-device and never leaves the browser).
      const record = lockMethod === "pin"
        ? await makePasscodeRecord(pin, "pin", biometric && bioSupported)
        : faceOnlyRecord();
      await setSecurity(uid, record);
      // A passkey (device Face ID / fingerprint) so unlock + next sign-in are one
      // tap. Required for face-only; a bonus for a passcode with biometrics on.
      if (bioSupported && (lockMethod === "face" || (lockMethod === "pin" && biometric))) {
        try { await registerPasskey(); } catch { /* optional for pin+bio */ }
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
      setActiveWorkspace(accountType);
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

        {step === 3 && (
          <motion.div key="s3" {...slide}>
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

        {step === 4 && (
          <motion.div key="s4" {...slide}>
            <StepHead icon={Lock} title="Lock Renew" sub="A passcode is asked every time you open Renew — a private lock over your money. This step is required; you can change it later in Settings." />

            {/* Method choice */}
            <div className="mt-5 inline-flex rounded-full border border-[var(--field-border)] bg-[var(--field-bg)] p-1 text-sm">
              <button type="button" onClick={() => { setLockMethod("pin"); setError(null); }} aria-pressed={lockMethod === "pin"}
                className={cn("rounded-full px-4 py-1.5 transition-colors", lockMethod === "pin" ? "bg-[var(--glass-bg-strong)] text-[var(--text-strong)]" : "text-[var(--text-muted)]")}>Passcode</button>
              {bioSupported && (
                <button type="button" onClick={() => { setLockMethod("face"); setError(null); }} aria-pressed={lockMethod === "face"}
                  className={cn("rounded-full px-4 py-1.5 transition-colors", lockMethod === "face" ? "bg-[var(--glass-bg-strong)] text-[var(--text-strong)]" : "text-[var(--text-muted)]")}>Face ID</button>
              )}
            </div>

            {lockMethod === "pin" ? (
              <div className="mt-6 flex flex-col items-center">
                <p className="text-body mb-5 text-sm font-medium">
                  {pinDone ? "Passcode set ✓" : pinStage === "enter" ? "Create a 4-digit passcode" : "Re-enter your passcode"}
                </p>
                <PinPad
                  value={pinStage === "enter" ? pin : pinConfirm}
                  onChange={(v) => (pinStage === "enter" ? setPin(v) : setPinConfirm(v))}
                  onComplete={onPinComplete}
                  shakeSignal={pinShake}
                />
                {bioSupported && (
                  <div className="mt-6 flex w-full items-center justify-between rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-3">
                    <span className="text-strong flex items-center gap-2 text-sm font-medium"><Fingerprint className="size-4.5 text-[var(--color-gold-500)]" />Also unlock with Face ID</span>
                    <Switch checked={biometric} onChange={setBiometric} label="Face ID unlock" />
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-6 flex flex-col items-center">
                <button type="button" onClick={setupFace} disabled={faceBusy || faceReady}
                  className={cn("grid size-24 place-items-center rounded-full border transition-all active:scale-95",
                    faceReady ? "border-emerald-500/40 bg-emerald-500/10" : "border-[var(--field-border)] bg-[var(--field-bg)]")}>
                  {faceReady ? <Check className="size-12 text-emerald-500" strokeWidth={2.5} /> : <Fingerprint className="size-12 text-[var(--color-gold-500)]" />}
                </button>
                <p className="text-muted mt-4 text-sm">{faceReady ? "Face ID is set up ✓" : faceBusy ? "Setting up…" : "Tap to set up Face ID"}</p>
              </div>
            )}
          </motion.div>
        )}

        {step === 5 && (
          <motion.div key="s5" {...slide}>
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
