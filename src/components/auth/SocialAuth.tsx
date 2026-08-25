"use client";

import { useState } from "react";
import { AlertCircle, Fingerprint, QrCode, ChevronRight, ShieldCheck } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { FadeScale, StaggerContainer, StaggerItem } from "@/components/motion";
import { GoogleIcon } from "@/components/brand/GoogleIcon";
import { useAuth } from "@/components/providers/AuthProvider";
import { signInWithGoogle, AuthError } from "@/lib/auth/client";
import { signInWithPasskey, usePasskeySupport } from "@/lib/auth/passkey-client";
import { QrSignIn } from "@/components/auth/QrSignIn";
import { useIsBrowser } from "@/lib/pwa/display-mode";
import { cn } from "@/lib/utils";

type Pending = null | "google" | "passkey";

/**
 * Renew's sign-in — deliberately modern and minimal: continue with Google, a
 * passkey (Face ID / Touch ID), or scan a QR from a device you're already on.
 * No passwords, no OTP. QR is offered only in a browser tab; the installed app
 * signs in with the passkey. One tap, premium, fast.
 */
export function SocialAuth({ title, subtitle }: { title: string; subtitle: string }) {
  const { configured } = useAuth();
  const passkeySupported = usePasskeySupport();
  const isBrowser = useIsBrowser();

  const [pending, setPending] = useState<Pending>(null);
  const [error, setError] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const busy = pending !== null;

  function goInside() {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload to pick up the fresh session cookie
    window.location.assign("/dashboard");
  }
  function fail(err: unknown) {
    setError(err instanceof AuthError ? err.message : "Something went wrong. Please try again.");
    setPending(null);
  }

  async function google() {
    setError(null);
    setPending("google");
    try { await signInWithGoogle(); goInside(); } catch (err) { fail(err); }
  }
  async function passkey() {
    setError(null);
    setPending("passkey");
    try { await signInWithPasskey(); goInside(); } catch (err) { fail(err); }
  }

  return (
    <FadeScale>
      <GlassCard padded>
        <h1 className="text-strong text-2xl font-medium tracking-tight">{title}</h1>
        <p className="text-muted mt-1 mb-6 text-sm">{subtitle}</p>

        {!configured && (
          <div className="mb-4 flex items-start gap-2 rounded-2xl border border-[var(--field-border)] bg-[var(--glass-bg-soft)] px-4 py-3 text-sm text-[var(--text-body)]">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-[var(--color-gold-500)]" />
            <span>Connect Firebase to sign in — add your project keys (see README).</span>
          </div>
        )}
        {error && (
          <div role="alert" className="mb-4 flex items-start gap-2 rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-300">
            <AlertCircle className="mt-0.5 size-4 shrink-0" /><span>{error}</span>
          </div>
        )}

        <StaggerContainer className="flex flex-col gap-3" stagger={0.08}>
          <StaggerItem>
            <AuthTile onClick={google} disabled={busy} loading={pending === "google"} icon={<GoogleIcon className="size-5" />} label="Continue with Google" primary />
          </StaggerItem>

          {passkeySupported && (
            <StaggerItem>
              <AuthTile onClick={passkey} disabled={busy} loading={pending === "passkey"} icon={<Fingerprint className="size-5 text-[var(--color-gold-500)]" />} label="Continue with a passkey" hint="Face ID / Touch ID" />
            </StaggerItem>
          )}

          {/* QR pairing is a browser-only affordance — the installed app is the
              thing you scan FROM, so it never needs to show a QR to itself. */}
          {isBrowser && (
            <StaggerItem>
              <AuthTile onClick={() => setQrOpen(true)} disabled={busy} icon={<QrCode className="size-5 text-[var(--color-gold-500)]" />} label="Scan QR to sign in" hint="Use a device you're signed in on" />
            </StaggerItem>
          )}
        </StaggerContainer>

        <p className="text-muted mt-6 flex items-center justify-center gap-1.5 text-xs">
          <ShieldCheck className="size-3.5 text-[var(--color-gold-500)]" />No passwords. Your money stays private on your device.
        </p>
      </GlassCard>
      <QrSignIn open={qrOpen} onClose={() => setQrOpen(false)} />
    </FadeScale>
  );
}

/** A single premium, tactile sign-in tile — icon left, label, chevron/spinner right. */
function AuthTile({
  onClick, disabled, loading, icon, label, hint, primary,
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon: React.ReactNode;
  label: string;
  hint?: string;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative flex h-[3.75rem] w-full items-center gap-3.5 overflow-hidden rounded-2xl border px-4 text-start transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-55 disabled:hover:translate-y-0",
        primary
          ? "border-[var(--focus-ring)]/40 bg-[var(--glass-bg-strong)] shadow-[var(--glass-shadow)]"
          : "border-[var(--field-border)] bg-[var(--field-bg)] hover:border-[var(--focus-ring)]/50",
      )}
    >
      {/* A light sheen sweeps across on hover — premium, tactile. */}
      <span aria-hidden className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[var(--glass-highlight)] to-transparent opacity-40 transition-transform duration-700 ease-out group-hover:translate-x-full" />
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--glass-bg-soft)] transition-colors duration-300 group-hover:bg-[var(--glass-bg-strong)]">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="text-strong block text-[0.95rem] font-medium leading-tight">{label}</span>
        {hint && <span className="text-muted block text-xs">{hint}</span>}
      </span>
      {loading ? (
        <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-[var(--text-muted)] border-t-transparent" />
      ) : (
        <ChevronRight className="size-4 shrink-0 text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5" />
      )}
    </button>
  );
}
