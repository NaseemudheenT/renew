"use client";

/**
 * A whisper-soft tap sound for buttons — a short, low, pleasant blip via Web
 * Audio (no asset to load). Kept deliberately subtle for a money app. The
 * AudioContext is created lazily on the first real gesture (satisfies browser
 * autoplay rules), and everything fails silently where audio isn't available.
 */

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(value: boolean): void {
  enabled = value;
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  ctx ??= new AC();
  return ctx;
}

export function playTap(): void {
  if (!enabled) return;
  const audio = getCtx();
  if (!audio) return;
  try {
    if (audio.state === "suspended") void audio.resume();
    const now = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.exponentialRampToValueAtTime(360, now + 0.06);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.045, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  } catch {
    /* audio unavailable — stay silent */
  }
}
