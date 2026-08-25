"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw, CheckCircle2, Smartphone } from "lucide-react";
import { AnimatedModal } from "@/components/motion";
import { BrandedQr } from "@/components/auth/BrandedQr";
import { signInWithCustomTokenAndSession, AuthError } from "@/lib/auth/client";

type Phase = "loading" | "waiting" | "approved" | "expired" | "error";

/**
 * Web side of QR sign-in. Shows a QR the person scans with the Renew app on
 * their phone; once they approve there, this browser is signed in. First time on
 * a device that leads into the mandatory Face ID + passcode setup; after that
 * they can just unlock with Face ID / their passkey.
 */
export function QrSignIn({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [qrUrl, setQrUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const start = useCallback(async () => {
    stop();
    setPhase("loading");
    setError(null);
    setQrUrl("");
    try {
      const res = await fetch("/api/auth/qr/create", { method: "POST" });
      if (!res.ok) throw new Error();
      const { sessionId } = (await res.json()) as { sessionId: string };
      setQrUrl(`${window.location.origin}/link#${sessionId}`);
      setPhase("waiting");

      pollRef.current = setInterval(async () => {
        try {
          const s = await fetch("/api/auth/qr/status");
          const data = (await s.json()) as { status: string; token?: string };
          if (data.status === "approved" && data.token) {
            stop();
            setPhase("approved");
            await signInWithCustomTokenAndSession(data.token);
            // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload to pick up the new session cookie
            window.location.assign("/dashboard");
          } else if (data.status === "expired" || data.status === "idle") {
            stop();
            setPhase("expired");
          }
        } catch {
          /* transient — keep polling */
        }
      }, 2000);
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Couldn't start QR sign-in.");
      setPhase("error");
    }
  }, [stop]);

  useEffect(() => {
    // Create the pairing + QR when the modal opens; state updates happen after
    // awaiting the /create request (an external system), the intended pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- external-system (fetch) kickoff on open
    if (open) void start();
    return stop;
  }, [open, start, stop]);

  return (
    <AnimatedModal open={open} onClose={onClose} title="Sign in with QR">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="grid size-56 place-items-center rounded-2xl bg-white p-3">
          {phase === "loading" && <Loader2 className="size-8 animate-spin text-[var(--color-gold-500)]" />}
          {(phase === "waiting" || phase === "approved") && qrUrl && (
            <BrandedQr value={qrUrl} size={200} className="size-full" />
          )}
          {phase === "expired" && (
            <button type="button" onClick={() => void start()} className="flex flex-col items-center gap-2 text-[var(--text-muted)]">
              <RefreshCw className="size-7" /><span className="text-xs font-medium">QR expired — tap to refresh</span>
            </button>
          )}
          {phase === "error" && <span className="px-4 text-sm text-rose-500">{error}</span>}
        </div>

        {phase === "approved" ? (
          <p className="text-body flex items-center justify-center gap-2 text-sm"><CheckCircle2 className="size-4 text-emerald-500" />Approved — signing you in…</p>
        ) : (
          <ol className="text-muted flex flex-col gap-1.5 text-start text-sm">
            <li className="flex items-center gap-2"><Smartphone className="size-4 shrink-0 text-[var(--color-gold-500)]" />On your phone, open Renew → <span className="text-body font-medium">Settings › Link a device</span></li>
            <li className="ps-6">(or just point your phone’s camera at this code)</li>
            <li className="ps-6">Scan this code, then tap <span className="text-body font-medium">Approve</span></li>
          </ol>
        )}
      </div>
    </AnimatedModal>
  );
}
