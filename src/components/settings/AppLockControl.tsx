"use client";

import { useState } from "react";
import { Lock, Fingerprint, ShieldCheck, KeyRound } from "lucide-react";
import { AnimatedButton, AnimatedModal } from "@/components/motion";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { toast } from "@/components/ui/toast-store";
import { useUserProfile } from "@/hooks/useUserProfile";
import { usePasskeySupport } from "@/lib/auth/passkey-client";
import { makePasscodeRecord, isValidPasscode, type PasscodeKind } from "@/lib/security/passcode";
import { setSecurity, clearSecurity, setBiometricEnabled } from "@/lib/firestore/profile";
import { markUnlocked } from "@/components/security/AppLock";
import { PatternPad } from "@/components/security/PatternPad";
import { cn } from "@/lib/utils";

/** Set, change, or turn off the Renew app-lock (passcode + Face ID). */
export function AppLockControl() {
  const { profile, uid } = useUserProfile();
  const passkeySupported = usePasskeySupport();
  const security = profile?.security ?? null;

  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<PasscodeKind>("pin");
  const [code, setCode] = useState("");
  const [confirm, setConfirm] = useState("");
  const [biometric, setBiometric] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openModal() {
    setKind(security?.kind ?? "pin");
    setCode("");
    setConfirm("");
    setBiometric(security?.biometricEnabled ?? passkeySupported);
    setError(null);
    setOpen(true);
  }

  async function save() {
    if (!uid) return;
    if (!isValidPasscode(code, kind)) {
      setError(kind === "pin" ? "Use 4–8 digits." : "Use at least 4 characters.");
      return;
    }
    if (code !== confirm) {
      setError("The two entries don't match.");
      return;
    }
    setSaving(true);
    try {
      const record = await makePasscodeRecord(code, kind, biometric && passkeySupported);
      await setSecurity(uid, record);
      markUnlocked(uid); // don't lock the user out of the session they just set it in
      toast({ title: "App lock is on", variant: "success" });
      setOpen(false);
    } catch {
      toast({ title: "Couldn't save — try again", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function turnOff() {
    if (!uid) return;
    try {
      await clearSecurity(uid);
      toast({ title: "App lock turned off" });
    } catch {
      toast({ title: "Couldn't update — try again", variant: "error" });
    }
  }

  async function toggleBiometric(next: boolean) {
    if (!uid || !security) return;
    try {
      await setBiometricEnabled(uid, security, next);
    } catch {
      toast({ title: "Couldn't update — try again", variant: "error" });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted text-xs">
        Lock Renew behind a passcode and Face ID — asked whenever you open it, on every device.
      </p>

      {security ? (
        <>
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-3">
            <ShieldCheck className="size-5 shrink-0 text-emerald-500" />
            <div className="min-w-0 flex-1">
              <p className="text-strong text-sm font-medium">App lock is on</p>
              <p className="text-muted text-xs">{security.kind === "pin" ? "PIN" : security.kind === "pattern" ? "Pattern" : "Passphrase"}{security.biometricEnabled ? " · Face ID" : ""}</p>
            </div>
          </div>
          {passkeySupported && (
            <div className="flex items-center justify-between rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-3">
              <span className="text-body flex items-center gap-2.5 text-sm"><Fingerprint className="size-4.5 text-[var(--color-gold-500)]" />Unlock with Face ID</span>
              <Switch checked={security.biometricEnabled} onChange={toggleBiometric} label="Unlock with Face ID" />
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <AnimatedButton variant="glass" onClick={openModal}><KeyRound className="size-4" />Change passcode</AnimatedButton>
            <AnimatedButton variant="ghost" onClick={turnOff}>Turn off</AnimatedButton>
          </div>
        </>
      ) : (
        <AnimatedButton onClick={openModal}><Lock className="size-4" />Set up app lock</AnimatedButton>
      )}

      <AnimatedModal open={open} onClose={() => setOpen(false)} title={security ? "Change passcode" : "Set up app lock"}>
        <div className="flex flex-col gap-4">
          <div className="inline-flex self-start rounded-full border border-[var(--field-border)] bg-[var(--field-bg)] p-1 text-sm">
            {(["pin", "text", "pattern"] as PasscodeKind[]).map((k) => (
              <button key={k} type="button" onClick={() => { setKind(k); setCode(""); setConfirm(""); setError(null); }} className={cn("rounded-full px-4 py-1.5 transition-colors", kind === k ? "bg-[var(--glass-bg-strong)] text-[var(--text-strong)]" : "text-[var(--text-muted)]")}>
                {k === "pin" ? "PIN" : k === "text" ? "Passphrase" : "Pattern"}
              </button>
            ))}
          </div>
          {kind === "pattern" ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] py-4">
              <span className="text-muted text-xs">{!code ? "Draw your pattern" : code !== confirm ? "Draw it again to confirm" : "Pattern confirmed ✓"}</span>
              <PatternPad key={!code ? "draw" : "confirm"} onComplete={(c) => { if (!code) setCode(c); else setConfirm(c); setError(null); }} />
              {code && <button type="button" onClick={() => { setCode(""); setConfirm(""); }} className="text-xs font-medium text-[var(--color-gold-600)] hover:underline">Start over</button>}
            </div>
          ) : (
            <>
              <Input
                label={kind === "pin" ? "New PIN (4–8 digits)" : "New passphrase"}
                type="password"
                inputMode={kind === "pin" ? "numeric" : "text"}
                value={code}
                autoFocus
                onChange={(e) => { setCode(e.target.value); setError(null); }}
                placeholder={kind === "pin" ? "••••" : "At least 4 characters"}
              />
              <Input
                label="Confirm"
                type="password"
                inputMode={kind === "pin" ? "numeric" : "text"}
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError(null); }}
                placeholder="Re-enter"
              />
            </>
          )}
          {passkeySupported && (
            <div className="flex items-center justify-between rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-3">
              <span className="text-body flex items-center gap-2.5 text-sm"><Fingerprint className="size-4.5 text-[var(--color-gold-500)]" />Also unlock with Face ID</span>
              <Switch checked={biometric} onChange={setBiometric} label="Also unlock with Face ID" />
            </div>
          )}
          {error && <p role="alert" className="text-sm text-rose-500">{error}</p>}
          <div className="flex justify-end gap-2">
            <AnimatedButton variant="ghost" onClick={() => setOpen(false)} disabled={saving}>Cancel</AnimatedButton>
            <AnimatedButton onClick={save} loading={saving}><Lock className="size-4" />{security ? "Update" : "Turn on"}</AnimatedButton>
          </div>
        </div>
      </AnimatedModal>
    </div>
  );
}
