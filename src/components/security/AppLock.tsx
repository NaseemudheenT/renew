"use client";

import { useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { Fingerprint, Delete, ArrowRight } from "lucide-react";
import { RenewMark } from "@/components/brand/RenewMark";
import { Wordmark } from "@/components/brand/Wordmark";
import { AnimatedButton } from "@/components/motion";
import { useUserProfile } from "@/hooks/useUserProfile";
import { usePasskeySupport, signInWithPasskey } from "@/lib/auth/passkey-client";
import { verifyPasscode } from "@/lib/security/passcode";
import { PatternPad } from "./PatternPad";
import { cn } from "@/lib/utils";

const UNLOCK_EVENT = "renew-unlock";
function keyFor(uid: string) {
  return `renew-unlocked:${uid}`;
}

/** Mark this session unlocked for the given user, and notify the gate. */
export function markUnlocked(uid: string) {
  try {
    sessionStorage.setItem(keyFor(uid), "1");
  } catch {
    /* storage unavailable — stay locked-safe */
  }
  window.dispatchEvent(new Event(UNLOCK_EVENT));
}

/** Whether the current session is unlocked for this user (hydration-safe). */
function useUnlocked(uid: string | null): boolean {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener(UNLOCK_EVENT, cb);
      window.addEventListener("storage", cb);
      return () => {
        window.removeEventListener(UNLOCK_EVENT, cb);
        window.removeEventListener("storage", cb);
      };
    },
    () => (uid ? sessionStorage.getItem(keyFor(uid)) === "1" : true),
    () => true,
  );
}

/**
 * The App Lock — a local passcode + Face ID gate shown on every open once the
 * person has set one up. Sits above the whole app; primary Firebase auth has
 * already happened, this is the second, on-device factor (like a banking app).
 */
export function AppLock() {
  const { profile, uid } = useUserProfile();
  const unlocked = useUnlocked(uid);
  const passkeySupported = usePasskeySupport();

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const security = profile?.security ?? null;
  // No lock configured, or already unlocked this session → render nothing.
  if (!uid || !security || unlocked) return null;

  const isPin = security.kind === "pin";
  const isPattern = security.kind === "pattern";

  async function submit(value: string) {
    if (!security || !uid || busy) return;
    setBusy(true);
    setError(null);
    try {
      const ok = await verifyPasscode(value, security);
      if (ok) {
        markUnlocked(uid);
      } else {
        setError("Wrong passcode. Try again.");
        setCode("");
      }
    } finally {
      setBusy(false);
    }
  }

  async function useBiometric() {
    if (!uid || busy) return;
    setBusy(true);
    setError(null);
    try {
      await signInWithPasskey();
      markUnlocked(uid);
    } catch {
      setError("Face ID didn't verify. Use your passcode.");
    } finally {
      setBusy(false);
    }
  }

  function press(digit: string) {
    if (code.length >= 8) return;
    const next = code + digit;
    setCode(next);
    setError(null);
    if (isPin && next.length >= 4) {
      // Auto-submit a PIN once it's a plausible length on the last expected digit.
    }
  }

  return (
    <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center px-6" style={{ background: "var(--bg-base)" }}>
      <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(160deg, var(--bg-tint-1), var(--bg-tint-2) 60%, var(--bg-tint-3))" }} />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex w-full max-w-xs flex-col items-center"
      >
        <RenewMark size={64} idSuffix="lock" />
        <div className="mt-3"><Wordmark sizeClassName="text-xl" /></div>
        <p className="text-muted mt-6 text-sm">{isPattern ? "Draw your pattern to unlock" : "Enter your passcode to unlock"}</p>

        {/* Pattern grid, masked dots for PIN, or a field for text. */}
        {isPattern ? (
          <div className="mt-5">
            <PatternPad disabled={busy} onComplete={(c) => void submit(c)} />
          </div>
        ) : isPin ? (
          <div className="mt-4 flex items-center gap-2.5" aria-hidden="true">
            {Array.from({ length: Math.max(4, code.length) }).map((_, i) => (
              <span key={i} className={cn("size-3 rounded-full border transition-colors", i < code.length ? "border-transparent bg-[var(--color-gold-500)]" : "border-[var(--field-border)]")} />
            ))}
          </div>
        ) : (
          <form
            className="mt-4 w-full"
            onSubmit={(e) => { e.preventDefault(); void submit(code); }}
          >
            <input
              type="password"
              autoFocus
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(null); }}
              placeholder="Passcode"
              className="h-12 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 text-center text-lg tracking-widest text-[var(--text-strong)] focus:border-[var(--focus-ring)] focus:outline-none"
            />
          </form>
        )}

        {error && <p role="alert" className="mt-3 text-sm text-rose-500">{error}</p>}

        {isPin && (
          <div className="mt-6 grid grid-cols-3 gap-3">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
              <button key={d} type="button" onClick={() => press(d)} disabled={busy} className="grid size-16 place-items-center rounded-full border border-[var(--field-border)] bg-[var(--field-bg)] text-xl font-medium text-[var(--text-strong)] backdrop-blur-md">
                {d}
              </button>
            ))}
            <button type="button" onClick={() => setCode("")} disabled={busy || !code} className="grid size-16 place-items-center rounded-full text-sm text-[var(--text-muted)] disabled:opacity-40">Clear</button>
            <button type="button" onClick={() => press("0")} disabled={busy} className="grid size-16 place-items-center rounded-full border border-[var(--field-border)] bg-[var(--field-bg)] text-xl font-medium text-[var(--text-strong)] backdrop-blur-md">0</button>
            <button type="button" onClick={() => setCode((c) => c.slice(0, -1))} disabled={busy || !code} aria-label="Delete" className="grid size-16 place-items-center rounded-full text-[var(--text-muted)] disabled:opacity-40"><Delete className="size-5" /></button>
          </div>
        )}

        {!isPattern && (
          <AnimatedButton className="mt-6 w-full" onClick={() => void submit(code)} loading={busy} disabled={code.length < 4}>
            Unlock <ArrowRight className="size-4" />
          </AnimatedButton>
        )}

        {security.biometricEnabled && passkeySupported && (
          <button type="button" onClick={useBiometric} disabled={busy} className="text-body mt-4 inline-flex items-center gap-2 text-sm hover:text-[var(--text-strong)]">
            <Fingerprint className="size-5 text-[var(--color-gold-500)]" />Unlock with Face ID
          </button>
        )}

        {/* Forgot passcode → restore with a passkey (works even if Face-ID unlock
            wasn't enabled, as long as this device has a Renew passkey). */}
        {passkeySupported && (
          <button type="button" onClick={useBiometric} disabled={busy} className="text-muted mt-4 text-xs hover:text-[var(--text-strong)]">
            Forgot passcode? Restore with a passkey
          </button>
        )}
      </motion.div>
    </div>
  );
}
