"use client";

import { useState, type FormEvent, type SyntheticEvent } from "react";
import { AlertCircle, CheckCircle2, Fingerprint, Lock, Mail, Phone, User2, QrCode } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/liquid-glass";
import { Input } from "@/components/ui/Input";
import { OtpInput } from "@/components/ui/OtpInput";
import { DialCodeSelect } from "@/components/ui/DialCodeSelect";
import { FadeScale } from "@/components/motion";
import { GoogleIcon } from "@/components/brand/GoogleIcon";
import { AppleIcon } from "@/components/brand/AppleIcon";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  signInWithEmail,
  signUpWithEmail,
  resetPassword,
  startPhoneSignIn,
  confirmPhoneCode,
  resetPhoneRecaptcha,
  signInWithGoogle,
  signInWithApple,
  AuthError,
} from "@/lib/auth/client";
import { signInWithPasskey, usePasskeySupport } from "@/lib/auth/passkey-client";
import { QrSignIn } from "@/components/auth/QrSignIn";
import { cn } from "@/lib/utils";

type Mode = "sign-in" | "sign-up";
type Method = "email" | "phone";
type Pending = null | "email" | "phone" | "passkey" | "google" | "apple";

const RECAPTCHA_ID = "renew-recaptcha";

/**
 * Renew's auth surface — every method in one calm card: email + password,
 * Continue with Google / Apple, a passkey (Face ID), and phone + OTP with a
 * global searchable dial-code picker. Every success does a full navigation to
 * the dashboard so the fresh session is always picked up (no stuck sign-in).
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
  const { configured } = useAuth();
  const passkeySupported = usePasskeySupport();
  const isSignUp = mode === "sign-up";
  const uiLocale = typeof navigator !== "undefined" ? navigator.language : "en";

  const [method, setMethod] = useState<Method>("email");

  // Phone
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [phoneStep, setPhoneStep] = useState<"number" | "code">("number");
  const [code, setCode] = useState("");

  // Email
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [qrOpen, setQrOpen] = useState(false);

  const busy = pending !== null;
  const e164 = `${countryCode}${phone.replace(/\D/g, "")}`;

  // Full navigation (not router.push) so the server re-reads the just-minted
  // httpOnly session cookie and renders the authenticated dashboard — a client
  // transition can race the cookie and leave the user stuck on sign-in.
  function goInside() {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intentional full reload to pick up the fresh session cookie
    window.location.assign("/dashboard");
  }
  function fail(err: unknown) {
    setError(err instanceof AuthError ? err.message : "Something went wrong.");
    setPending(null);
  }
  function clearBanners() {
    setError(null);
    setNotice(null);
  }
  function switchMethod(next: Method) {
    clearBanners();
    if (next === "email") resetPhoneRecaptcha();
    setMethod(next);
  }

  /* ---- Email ------------------------------------------------------------ */
  async function onEmailSubmit(e: FormEvent) {
    e.preventDefault();
    clearBanners();
    setPending("email");
    try {
      if (isSignUp) await signUpWithEmail({ name, email, password });
      else await signInWithEmail({ email, password });
      goInside();
    } catch (err) {
      fail(err);
    }
  }
  async function onForgot() {
    clearBanners();
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

  /* ---- Phone ------------------------------------------------------------ */
  async function onSendCode(e: SyntheticEvent) {
    e.preventDefault();
    clearBanners();
    if (phone.replace(/\D/g, "").length < 6) {
      setError("Enter a valid phone number.");
      return;
    }
    setPending("phone");
    try {
      await startPhoneSignIn(e164, RECAPTCHA_ID);
      setPhoneStep("code");
      setNotice(`Code sent to ${e164}.`);
      setPending(null);
    } catch (err) {
      fail(err);
    }
  }
  async function onVerifyCode(value?: string) {
    const entered = (value ?? code).replace(/\D/g, "");
    clearBanners();
    if (entered.length < 6) {
      setError("Enter the 6-digit code we sent you.");
      return;
    }
    setPending("phone");
    try {
      await confirmPhoneCode(entered);
      goInside();
    } catch (err) {
      fail(err);
    }
  }
  function changeNumber() {
    clearBanners();
    resetPhoneRecaptcha();
    setPhoneStep("number");
    setCode("");
  }

  /* ---- Social + passkey ------------------------------------------------- */
  async function social(kind: "google" | "apple") {
    clearBanners();
    setPending(kind);
    try {
      await (kind === "google" ? signInWithGoogle() : signInWithApple());
      goInside();
    } catch (err) {
      fail(err);
    }
  }
  async function passkey() {
    clearBanners();
    setPending("passkey");
    try {
      await signInWithPasskey();
      goInside();
    } catch (err) {
      fail(err);
    }
  }

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

        {/* EMAIL */}
        {method === "email" && (
          <form onSubmit={onEmailSubmit} className="flex flex-col gap-3.5">
            {isSignUp && (
              <Input label="Name" type="text" autoComplete="name" placeholder="Your name" icon={<User2 className="size-4.5" />} value={name} onChange={(e) => setName(e.target.value)} required disabled={busy} />
            )}
            <Input label="Email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" icon={<Mail className="size-4.5" />} value={email} onChange={(e) => setEmail(e.target.value)} required disabled={busy} />
            <Input label="Password" type="password" autoComplete={isSignUp ? "new-password" : "current-password"} placeholder={isSignUp ? "At least 6 characters" : "Your password"} icon={<Lock className="size-4.5" />} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} disabled={busy} />
            {!isSignUp && (
              <button type="button" onClick={onForgot} disabled={busy} className="-mt-1 self-end text-sm font-medium text-[var(--color-gold-600)] hover:underline disabled:opacity-55">
                Forgot password?
              </button>
            )}
            <GlassButton type="submit" variant="primary" fullWidth disabled={busy} className="mt-1 h-12 text-[0.95rem] font-semibold">
              {pending === "email" ? (isSignUp ? "Creating account…" : "Signing in…") : isSignUp ? "Create account" : "Sign in"}
            </GlassButton>
          </form>
        )}

        {/* PHONE */}
        {method === "phone" && phoneStep === "number" && (
          <form onSubmit={onSendCode} className="flex flex-col gap-3.5">
            <div>
              <label htmlFor="renew-phone" className="mb-2 block text-sm font-medium text-[var(--text-body)]">Phone number</label>
              <div className="flex gap-2">
                <DialCodeSelect value={countryCode} onChange={setCountryCode} locale={uiLocale} disabled={busy} />
                <Input id="renew-phone" type="tel" autoComplete="tel-national" inputMode="numeric" placeholder="90000 00001" icon={<Phone className="size-4.5" />} value={phone} onChange={(e) => setPhone(e.target.value)} required disabled={busy} className="flex-1" />
              </div>
            </div>
            <GlassButton type="submit" variant="primary" fullWidth disabled={busy} className="mt-1 h-12 text-[0.95rem] font-semibold">
              {pending === "phone" ? "Sending code…" : "Send code"}
            </GlassButton>
          </form>
        )}
        {method === "phone" && phoneStep === "code" && (
          <div className="flex flex-col gap-4">
            <div className="text-center text-sm text-[var(--text-body)]">Enter the code sent to <span className="font-medium text-[var(--text-strong)]">{e164}</span></div>
            <OtpInput value={code} onChange={setCode} onComplete={(v) => onVerifyCode(v)} disabled={busy} error={Boolean(error)} autoFocus />
            <GlassButton type="button" variant="primary" fullWidth disabled={busy} onClick={() => onVerifyCode()} className="h-12 text-[0.95rem] font-semibold">
              {pending === "phone" ? "Verifying…" : "Verify & continue"}
            </GlassButton>
            <div className="flex items-center justify-between text-sm">
              <button type="button" onClick={changeNumber} disabled={busy} className="font-medium text-[var(--text-muted)] hover:text-[var(--text-strong)] disabled:opacity-55">Change number</button>
              <button type="button" onClick={onSendCode} disabled={busy} className="font-medium text-[var(--color-gold-600)] hover:underline disabled:opacity-55">Resend code</button>
            </div>
          </div>
        )}

        {/* Method toggle */}
        {phoneStep === "number" && (
          <button type="button" onClick={() => switchMethod(method === "email" ? "phone" : "email")} disabled={busy} className="mt-4 block w-full text-center text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-strong)] disabled:opacity-55">
            {method === "email" ? "Use phone number instead" : "Use email & password instead"}
          </button>
        )}

        <div className="my-5 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-[var(--glass-border)]" />
          <span className="text-xs uppercase tracking-wider text-[var(--text-muted)]">or continue with</span>
          <span className="h-px flex-1 bg-[var(--glass-border)]" />
        </div>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <GlassButton type="button" variant="neutral" fullWidth onClick={() => social("google")} disabled={busy} className="h-12 gap-2 text-[0.9rem] font-medium">
              <GoogleIcon className="size-5" />{pending === "google" ? "…" : "Google"}
            </GlassButton>
            <GlassButton type="button" variant="neutral" fullWidth onClick={() => social("apple")} disabled={busy} className="h-12 gap-2 text-[0.9rem] font-medium">
              <AppleIcon className="size-[1.15rem]" />{pending === "apple" ? "…" : "Apple"}
            </GlassButton>
          </div>
          {passkeySupported && (
            <GlassButton type="button" variant="neutral" fullWidth onClick={passkey} disabled={busy} className={cn("h-12 gap-2.5 text-[0.95rem] font-medium")}>
              <Fingerprint className="size-5" />{pending === "passkey" ? "Waiting for Face ID…" : "Passkey (Face ID)"}
            </GlassButton>
          )}
          <GlassButton type="button" variant="neutral" fullWidth onClick={() => setQrOpen(true)} disabled={busy} className="h-12 gap-2.5 text-[0.95rem] font-medium">
            <QrCode className="size-5" />Sign in with QR
          </GlassButton>
        </div>

        <div id={RECAPTCHA_ID} />
      </GlassCard>
      <QrSignIn open={qrOpen} onClose={() => setQrOpen(false)} />
    </FadeScale>
  );
}
