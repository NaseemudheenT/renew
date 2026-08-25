"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { MonitorSmartphone, CheckCircle2, AlertCircle, Camera, Loader2 } from "lucide-react";
import { AnimatedButton, AnimatedModal } from "@/components/motion";

type Phase = "idle" | "starting" | "scanning" | "approving" | "done" | "error";

/**
 * "Link a device" — the phone side of QR sign-in, from inside the app. Opens the
 * camera, scans the QR shown on a computer's Renew login, and approves it so the
 * computer signs into THIS account. Same secure server flow as scanning with the
 * native camera; this just keeps it in-app (WhatsApp "Linked devices" style).
 */
export function DeviceLinkControl() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const handledRef = useRef(false);

  const stopCamera = useCallback(() => {
    if (scanRef.current) { clearInterval(scanRef.current); scanRef.current = null; }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const approve = useCallback(async (sessionId: string) => {
    setPhase("approving");
    stopCamera();
    try {
      const res = await fetch("/api/auth/qr/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) { setMessage(data.error ?? "Couldn't approve this code."); setPhase("error"); return; }
      setPhase("done");
    } catch {
      setMessage("Network error. Please try again.");
      setPhase("error");
    }
  }, [stopCamera]);

  /** Only accept a QR that is genuinely a Renew /link URL on THIS origin. */
  const sessionFromText = useCallback((text: string): string | null => {
    try {
      const url = new URL(text);
      if (url.origin !== window.location.origin) return null;
      if (url.pathname !== "/link") return null;
      const id = url.hash.replace(/^#/, "").trim();
      return id || null;
    } catch {
      return null;
    }
  }, []);

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || handledRef.current) return;
    if (video.readyState < video.HAVE_ENOUGH_DATA || !video.videoWidth) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
    if (!code?.data) return;
    const sessionId = sessionFromText(code.data);
    if (sessionId) { handledRef.current = true; void approve(sessionId); }
  }, [approve, sessionFromText]);

  const start = useCallback(async () => {
    handledRef.current = false;
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage("This device has no camera access. Try scanning with your phone's camera app instead.");
      setPhase("error");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.setAttribute("playsinline", "true");
        await video.play().catch(() => {});
      }
      setPhase("scanning");
      scanRef.current = setInterval(scanFrame, 250);
    } catch {
      setMessage("Camera permission is needed to scan. You can also open your phone's camera app and scan the QR directly.");
      setPhase("error");
    }
  }, [scanFrame]);

  useEffect(() => {
    // Kick off the camera when the sheet opens — the state updates happen after
    // awaiting getUserMedia (an external system), which is the intended pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- external-system (camera) kickoff on open
    if (open) void start();
    return stopCamera;
  }, [open, start, stopCamera]);

  function close() {
    stopCamera();
    setOpen(false);
    setPhase("idle");
    setMessage(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted text-xs">
        Sign a computer into Renew by scanning the QR on its login screen with this phone. You stay in control — nothing is shared but the sign-in.
      </p>
      <AnimatedButton variant="glass" onClick={() => { setMessage(null); setPhase("starting"); setOpen(true); }} className="self-start">
        <MonitorSmartphone className="size-4" />Link a device
      </AnimatedButton>

      <AnimatedModal open={open} onClose={close} title="Link a device">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative grid aspect-square w-full max-w-[18rem] place-items-center overflow-hidden rounded-2xl border border-[var(--field-border)] bg-black/60">
            <video ref={videoRef} className="size-full object-cover" muted playsInline />
            <canvas ref={canvasRef} className="hidden" />
            {(phase === "starting" || phase === "approving") && (
              <div className="absolute inset-0 grid place-items-center bg-black/40">
                <Loader2 className="size-8 animate-spin text-white/90" />
              </div>
            )}
            {phase === "scanning" && (
              <div className="pointer-events-none absolute inset-6 rounded-xl border-2 border-white/70" />
            )}
            {phase === "done" && (
              <div className="absolute inset-0 grid place-items-center bg-black/60"><CheckCircle2 className="size-12 text-emerald-400" /></div>
            )}
            {phase === "error" && (
              <div className="absolute inset-0 grid place-items-center bg-black/70 p-5"><Camera className="size-8 text-white/70" /></div>
            )}
          </div>

          {phase === "scanning" && <p className="text-muted text-sm">Point your camera at the QR on your computer.</p>}
          {phase === "approving" && <p className="text-muted text-sm">Approving…</p>}
          {phase === "done" && (
            <div className="flex flex-col items-center gap-1">
              <p className="text-strong text-sm font-medium">Device signed in</p>
              <p className="text-muted text-sm">Your computer is signing into Renew now.</p>
              <AnimatedButton className="mt-2" onClick={close}>Done</AnimatedButton>
            </div>
          )}
          {phase === "error" && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-body flex items-center gap-2 text-sm"><AlertCircle className="size-4 text-rose-500" />{message}</p>
              <AnimatedButton variant="glass" onClick={() => void start()}>Try again</AnimatedButton>
            </div>
          )}
        </div>
      </AnimatedModal>
    </div>
  );
}
