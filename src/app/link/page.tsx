"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Smartphone, ShieldCheck, CheckCircle2, AlertCircle, MonitorSmartphone } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedButton } from "@/components/motion";
import { RenewMark } from "@/components/brand/RenewMark";
import { Wordmark } from "@/components/brand/Wordmark";
import { useAuth } from "@/components/providers/AuthProvider";

type State = "checking" | "ready" | "approving" | "approved" | "denied" | "invalid" | "signin" | "error";

/**
 * Phone-side of QR sign-in. The person scans the QR shown on their computer,
 * which opens this page with the pairing id in the URL fragment (never sent to
 * the server). If they're signed in here, approving mints the computer a session.
 */
export default function LinkPage() {
  const { user, loading } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [state, setState] = useState<State>("checking");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = (typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "").trim();
    setSessionId(id || null);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!sessionId) { setState("invalid"); return; }
    if (!user) { setState("signin"); return; }
    setState((s) => (s === "checking" || s === "signin" ? "ready" : s));
  }, [loading, sessionId, user]);

  async function approve() {
    if (!sessionId) return;
    setState("approving");
    setError(null);
    try {
      const res = await fetch("/api/auth/qr/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) { setError(data.error ?? "Couldn't approve. Try a fresh QR."); setState("error"); return; }
      setState("approved");
    } catch {
      setError("Network error. Please try again.");
      setState("error");
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      <div className="mb-8 flex flex-col items-center gap-3">
        <RenewMark size={54} />
        <Wordmark sizeClassName="text-lg" />
      </div>

      <GlassCard padded className="w-full max-w-sm text-center">
        {state === "checking" && <p className="text-muted py-6 text-sm">Checking your sign-in request…</p>}

        {state === "invalid" && (
          <div className="flex flex-col items-center gap-3 py-2">
            <AlertCircle className="size-8 text-rose-500" />
            <h1 className="text-strong text-lg font-medium">Invalid link</h1>
            <p className="text-muted text-sm">Scan the QR shown on your computer’s Renew sign-in screen.</p>
          </div>
        )}

        {state === "signin" && (
          <div className="flex flex-col items-center gap-3 py-2">
            <Smartphone className="size-8 text-[var(--color-gold-500)]" />
            <h1 className="text-strong text-lg font-medium">Sign in first</h1>
            <p className="text-muted text-sm">Sign in to Renew on this phone, then scan the QR again to approve your computer.</p>
            <Link href="/sign-in" className="mt-1"><AnimatedButton>Sign in</AnimatedButton></Link>
          </div>
        )}

        {(state === "ready" || state === "approving") && (
          <div className="flex flex-col items-center gap-4 py-2">
            <MonitorSmartphone className="size-9 text-[var(--color-gold-500)]" />
            <h1 className="text-strong text-lg font-medium">Sign in on your computer?</h1>
            <p className="text-muted text-sm">
              Approving signs your computer into <span className="text-strong font-medium">{user?.email ?? "your account"}</span>. Only approve a QR you’re looking at right now.
            </p>
            <p className="text-muted flex items-center gap-1.5 text-xs"><ShieldCheck className="size-3.5 text-[var(--color-gold-500)]" />Renew never shares your password — this just links the device.</p>
            <div className="mt-1 flex w-full gap-3">
              <AnimatedButton variant="ghost" fullWidth onClick={() => setState("denied")} disabled={state === "approving"}>Not now</AnimatedButton>
              <AnimatedButton fullWidth onClick={approve} loading={state === "approving"}>Approve</AnimatedButton>
            </div>
          </div>
        )}

        {state === "approved" && (
          <div className="flex flex-col items-center gap-3 py-2">
            <CheckCircle2 className="size-9 text-emerald-500" />
            <h1 className="text-strong text-lg font-medium">Approved</h1>
            <p className="text-muted text-sm">Head back to your computer — it’s signing in now. You can close this tab.</p>
          </div>
        )}

        {state === "denied" && (
          <div className="flex flex-col items-center gap-3 py-2">
            <ShieldCheck className="size-9 text-[var(--color-gold-500)]" />
            <h1 className="text-strong text-lg font-medium">Dismissed</h1>
            <p className="text-muted text-sm">No device was signed in. You can close this tab.</p>
          </div>
        )}

        {state === "error" && (
          <div className="flex flex-col items-center gap-3 py-2">
            <AlertCircle className="size-8 text-rose-500" />
            <h1 className="text-strong text-lg font-medium">Couldn’t approve</h1>
            <p className="text-muted text-sm">{error}</p>
            <AnimatedButton variant="glass" onClick={() => setState("ready")}>Try again</AnimatedButton>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
