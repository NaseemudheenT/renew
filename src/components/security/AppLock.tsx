"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import { Delete, Fingerprint } from "lucide-react";
import { RenewMark } from "@/components/brand/RenewMark";
import { useUserProfile } from "@/hooks/useUserProfile";
import { verifyPasscode } from "@/lib/security/passcode";
import { signInWithPasskey, isPasskeySupported } from "@/lib/auth/passkey-client";
import { signOutUser } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

const UNLOCK_KEY = "renew_unlocked";

/** Was the app already unlocked this browser session? (Re-locks on a new session.) */
function readUnlocked(): boolean {
  try { return sessionStorage.getItem(UNLOCK_KEY) === "1"; } catch { return false; }
}

/**
 * Renew's app lock — an iPhone-style passcode screen shown on open when the user
 * has set a PIN. It's a LOCAL convenience layer over the real Firebase session:
 * unlock with the PIN or Face ID; "Forgot" signs out (the safe escape — no one
 * can be permanently locked out). Unlock lasts the browser session.
 */
export function AppLock() {
  const { profile } = useUserProfile();
  const security = profile?.security ?? null;
  const [unlocked, setUnlocked] = useState<boolean>(() => readUnlocked());
  const [entry, setEntry] = useState("");
  const [error, setError] = useState(false);
  const [bioBusy, setBioBusy] = useState(false);
  const shake = useAnimationControls();
  const verifying = useRef(false);

  const locked = !!security && !unlocked;

  const unlock = useCallback(() => {
    try { sessionStorage.setItem(UNLOCK_KEY, "1"); } catch { /* ignore */ }
    setUnlocked(true);
    setEntry("");
    setError(false);
  }, []);

  // Auto-verify as digits are entered (PINs are 4–8 long).
  useEffect(() => {
    if (!security || entry.length < 4 || verifying.current) return;
    verifying.current = true;
    verifyPasscode(entry, security)
      .then((ok) => {
        if (ok) { unlock(); return; }
        if (entry.length >= 8) {
          setError(true);
          void shake.start({ x: [0, -10, 9, -7, 5, -2, 0], transition: { duration: 0.4 } });
          setTimeout(() => { setEntry(""); setError(false); }, 350);
        }
      })
      .finally(() => { verifying.current = false; });
  }, [entry, security, unlock, shake]);

  if (!locked) return null;

  const press = (d: string) => { if (entry.length < 8) { setError(false); setEntry((e) => e + d); } };
  const back = () => setEntry((e) => e.slice(0, -1));

  async function faceId() {
    setBioBusy(true);
    try { await signInWithPasskey(); unlock(); }
    catch { setError(true); void shake.start({ x: [0, -8, 6, -4, 0], transition: { duration: 0.3 } }); }
    finally { setBioBusy(false); }
  }

  const dots = Array.from({ length: Math.max(4, entry.length) });
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"] as const;
  const bio = security?.biometricEnabled && isPasskeySupported();

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

          {/* Dots */}
          <motion.div animate={shake} className="mt-6 flex items-center gap-3.5">
            {dots.map((_, i) => (
              <span key={i} className={cn("size-3 rounded-full transition-colors", i < entry.length ? (error ? "bg-rose-500" : "bg-[var(--color-gold-500)]") : "bg-[var(--text-muted)]/30")} />
            ))}
          </motion.div>

          {/* Keypad */}
          <div className="mt-10 grid grid-cols-3 gap-4">
            {keys.map((k, i) => {
              if (k === "") return <span key={i} />;
              if (k === "back") return (
                <button key={i} type="button" onClick={back} aria-label="Delete" className="grid size-[4.5rem] place-items-center rounded-full text-[var(--text-body)] transition-colors active:bg-[var(--glass-bg-soft)]">
                  <Delete className="size-6" />
                </button>
              );
              return (
                <button key={i} type="button" onClick={() => press(k)} aria-label={k}
                  className="grid size-[4.5rem] place-items-center rounded-full border border-[var(--field-border)] bg-[var(--field-bg)] text-2xl font-light text-[var(--text-strong)] transition-all active:scale-95 active:bg-[var(--glass-bg-strong)]">
                  {k}
                </button>
              );
            })}
          </div>

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
