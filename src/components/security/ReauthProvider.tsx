"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Fingerprint, ShieldCheck } from "lucide-react";
import { AnimatedModal, AnimatedButton } from "@/components/motion";
import { useUserProfile } from "@/hooks/useUserProfile";
import { usePasskeySupport, signInWithPasskey } from "@/lib/auth/passkey-client";
import { verifyPasscode } from "@/lib/security/passcode";

type RequireReauth = (reason?: string) => Promise<boolean>;

const ReauthContext = createContext<RequireReauth>(async () => true);

/** Ask for Face ID / passcode before a sensitive action; resolves true if verified. */
export function useReauth(): RequireReauth {
  return useContext(ReauthContext);
}

/**
 * Gates sensitive actions (e.g. exporting your data, revealing balances) behind the person's
 * App Lock. If no passcode is configured, actions pass straight through — the
 * lock is the second factor when it exists. Promise-based: callers do
 * `if (await requireReauth("to pay this bill")) { ...act... }`.
 */
export function ReauthProvider({ children }: { children: ReactNode }) {
  const { profile } = useUserProfile();
  const security = profile?.security ?? null;
  const passkeySupported = usePasskeySupport();

  const [reason, setReason] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const resolverRef = useRef<((v: boolean) => void) | null>(null);

  const requireReauth = useCallback<RequireReauth>(
    (r) => {
      if (!security) return Promise.resolve(true);
      setReason(r ?? null);
      setCode("");
      setError(null);
      setOpen(true);
      return new Promise<boolean>((resolve) => {
        resolverRef.current = resolve;
      });
    },
    [security],
  );

  function finish(value: boolean) {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setOpen(false);
    setCode("");
    setBusy(false);
  }

  async function submit() {
    if (!security || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (await verifyPasscode(code, security)) finish(true);
      else { setError("Wrong passcode."); setCode(""); }
    } finally {
      setBusy(false);
    }
  }

  async function biometric() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await signInWithPasskey();
      finish(true);
    } catch {
      setError("Face ID didn't verify — use your passcode.");
    } finally {
      setBusy(false);
    }
  }

  const isPin = security?.kind === "pin";

  return (
    <ReauthContext.Provider value={requireReauth}>
      {children}
      <AnimatedModal open={open} onClose={() => finish(false)} title="Confirm it's you">
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="grid size-12 place-items-center rounded-full bg-[var(--glass-bg-strong)]">
            <ShieldCheck className="size-6 text-[var(--color-gold-500)]" />
          </div>
          <p className="text-muted text-sm">{reason ? `Verify ${reason}.` : "Verify it's you to continue."}</p>
          <form
            className="w-full"
            onSubmit={(e) => { e.preventDefault(); void submit(); }}
          >
            <input
              type="password"
              inputMode={isPin ? "numeric" : "text"}
              autoFocus
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(null); }}
              placeholder={isPin ? "Passcode" : "Passphrase"}
              className="h-12 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 text-center text-lg tracking-widest text-[var(--text-strong)] focus:border-[var(--focus-ring)] focus:outline-none"
            />
          </form>
          {error && <p role="alert" className="text-sm text-rose-500">{error}</p>}
          <AnimatedButton className="w-full" onClick={() => void submit()} loading={busy} disabled={code.length < 4}>
            Confirm
          </AnimatedButton>
          {security?.biometricEnabled && passkeySupported && (
            <button type="button" onClick={biometric} disabled={busy} className="text-body inline-flex items-center gap-2 text-sm hover:text-[var(--text-strong)]">
              <Fingerprint className="size-5 text-[var(--color-gold-500)]" />Use Face ID
            </button>
          )}
        </div>
      </AnimatedModal>
    </ReauthContext.Provider>
  );
}
