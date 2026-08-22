"use client";

/**
 * A futuristic "liquid-glass" tap for buttons — a soft, glassy bloop synthesised
 * live via Web Audio (no asset to load). Two sine voices (a rising shimmer over a
 * low body) pass through a lowpass filter that opens as it plays, giving a fluid,
 * water-drop feel; the envelope is fast and gentle so it's barely-there but clearly
 * heard. Deliberately restrained for a money app. The AudioContext is created
 * lazily on the first real gesture (browser autoplay rules) and everything fails
 * silently where audio isn't available.
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
    const dur = 0.16;

    // A lowpass that opens up as it plays → the "liquid" swell.
    const filter = audio.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.setValueAtTime(6, now);
    filter.frequency.setValueAtTime(700, now);
    filter.frequency.exponentialRampToValueAtTime(2800, now + 0.07);
    filter.frequency.exponentialRampToValueAtTime(900, now + dur);

    // Master envelope — fast, gentle, barely-there but audible.
    const gain = audio.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.032, now + 0.007);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    filter.connect(gain);
    gain.connect(audio.destination);

    // Voice 1 — rising glassy shimmer.
    const shimmer = audio.createOscillator();
    shimmer.type = "sine";
    shimmer.frequency.setValueAtTime(640, now);
    shimmer.frequency.exponentialRampToValueAtTime(960, now + 0.05);
    shimmer.frequency.exponentialRampToValueAtTime(720, now + dur);
    shimmer.connect(filter);

    // Voice 2 — soft low body, a touch quieter, for warmth.
    const body = audio.createOscillator();
    const bodyGain = audio.createGain();
    body.type = "sine";
    body.frequency.setValueAtTime(300, now);
    bodyGain.gain.setValueAtTime(0.6, now);
    body.connect(bodyGain);
    bodyGain.connect(filter);

    shimmer.start(now);
    body.start(now);
    shimmer.stop(now + dur + 0.02);
    body.stop(now + dur + 0.02);
  } catch {
    /* audio unavailable — stay silent */
  }
}
