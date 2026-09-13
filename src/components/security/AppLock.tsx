"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Fingerprint } from "lucide-react";
import { RenewMark } from "@/components/brand/RenewMark";
import { PinPad } from "@/components/security/PinPad";
import { useUserProfile } from "@/hooks/useUserProfile";
import { verifyPasscode } from "@/lib/security/passcode";
import { signInWithPasskey, isPasskeySupported } from "@/lib/auth/passkey-client";
import { signOutUser } from "@/lib/auth/client";

const UNLOCK_KEY = "renew_unlocked";
const MAX_ATTEMPTS = 5;

/** Was the app already unlocked this browser session? (Re-locks on a new session.) */
function readUnlocked(): boolean {
  try { return sessionStorage.getItem(UNLOCK_KEY) === "1"; } catch { return false; }
}

/**
 * Renew's app lock — an iPhone-style passcode screen shown on open when the user
 * has set a PIN. It's a LOCAL convenience layer over the real Firebase session:
 * unlock with the 4-digit PIN or Face ID. Wrong entries shake and clear (exactly
 * like iOS); after five wrong tries we guide them to recover with Face ID or by
 * signing in again — no one can ever be permanently locked out. Unlock lasts the
 * browser session.
 */
export function AppLock() {
  const { profile } = useUserProfile();
  const security = profile?.security ?? null;
  const [unlocked, setUnlocked] = useState<boolean>(() => readUnlocked());
  const [entry, setEntry] = useState("");
  const [shakeSignal, setShakeSignal] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [bioBusy, setBioBusy] = useState(false);

  const locked = !!security && !unlocked;
  const lockedOut = attempts >= MAX_ATTEMPTS;

  const unlock = useCallback(() => {
    try { sessionStorage.setItem(UNLOCK_KEY, "1"); } catch { /* ignore */ }
    setUnlocked(true);
    setEntry("");
  }, []);

  const verify = useCallback(async (code: string) => {
    if (!security) return;
    const ok = await verifyPasscode(code, security);
    if (ok) { unlock(); return; }
    setEntry("");
    setShakeSignal((s) => s + 1);
    setAttempts((a) => a + 1);
  }, [security, unlock]);

  async function faceId() {
    setBioBusy(true);
    try { await signInWithPasskey(); unlock(); }
    catch { setShakeSignal((s) => s + 1); }
    finally { setBioBusy(false); }
  }

  if (!locked) return null;

  const bio = security?.biometricEnabled && isPasskeySupported();

  // Face-ID-only lock — no PIN to type, just the biometric prompt.
  if (security?.faceOnly) {
    return (
      <AnimatePresence>
        <motion.div role="dialog" aria-modal="true" aria-label="Unlock Renew"
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center px-6"
          style={{ background: "var(--bg-base)" }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-[30%] size-[42vmax] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px]" style={{ background: "radial-gradient(circle, var(--bokeh-1), transparent 66%)" }} />
          <div className="relative flex flex-col items-center">
            <RenewMark size={52} idSuffix="lock" />
            <p className="text-strong mt-6 text-base font-medium">Unlock Renew</p>
            <button type="button" onClick={faceId} disabled={bioBusy}
              className="mt-8 grid size-24 place-items-center rounded-full border border-[var(--field-border)] bg-[var(--field-bg)] transition-all active:scale-95 disabled:opacity-50">
              <Fingerprint className="size-12 text-[var(--color-gold-500)]" />
            </button>
            <p className="text-muted mt-4 text-sm">{bioBusy ? "Verifying…" : "Tap to unlock with Face ID"}</p>
            <button type="button" onClick={() => { void signOutUser(); }} className="text-muted mt-8 text-sm hover:text-[var(--text-strong)]">
              Forgot? Sign out
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        role="dialog" aria-modal="true" aria-label="Enter your passcode"
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center px-6"
        style={{ background: "var(--bg-base)" }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-[30%] size-[42vmax] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px]" style={{ background: "radial-gradient(circle, var(--bokeh-1), transparent 66%)" }} />

        <div className="relative flex flex-col items-center">
          <RenewMark size={52} idSuffix="lock" />
          <p className="text-strong mt-6 text-base font-medium">Enter your passcode</p>

          <div className="mt-7">
            <PinPad value={entry} onChange={setEntry} onComplete={(code) => void verify(code)} shakeSignal={shakeSignal} />
          </div>

          {lockedOut && (
            <p className="mt-6 max-w-xs text-center text-sm text-rose-500">
              Too many attempts. Unlock with Face ID, or sign out and sign back in to reset your passcode.
            </p>
          )}

          <div className="mt-8 flex items-center gap-6">
            {bio && (
              <button type="button" onClick={faceId} disabled={bioBusy} className="text-body inline-flex items-center gap-2 text-sm font-medium disabled:opacity-50">
                <Fingerprint className="size-5 text-[var(--color-gold-500)]" />{bioBusy ? "…" : "Face ID"}
              </button>
            )}
            <button type="button" onClick={() => { void signOutUser(); }} className="text-muted text-sm hover:text-[var(--text-strong)]">
              Forgot? Sign out
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
