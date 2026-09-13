"use client";

import { availableVoices } from "@/lib/voice";

/**
 * Ren's voices — four named, curated choices (like Siri / ChatGPT), instead of
 * exposing the raw, messy device voice list. Each preset resolves at speak-time
 * to the best matching real system voice for the user's language and the
 * preset's character. If nothing matches, speech falls back to the language
 * default — Ren always speaks.
 */

export type RenGender = "female" | "male";

export interface RenVoice {
  id: string;
  name: string;
  gender: RenGender;
  tagline: string;
}

export const REN_VOICES: RenVoice[] = [
  { id: "aria", name: "Aria", gender: "female", tagline: "Warm and clear" },
  { id: "nova", name: "Nova", gender: "female", tagline: "Bright and calm" },
  { id: "kai", name: "Kai", gender: "male", tagline: "Steady and grounded" },
  { id: "onyx", name: "Onyx", gender: "male", tagline: "Deep and composed" },
];

export const DEFAULT_REN_VOICE = "aria";

export function renVoice(id: string | undefined | null): RenVoice {
  return REN_VOICES.find((v) => v.id === id) ?? REN_VOICES[0]!;
}

// Names that strongly signal a voice's gender across common TTS engines.
const FEMALE = /(female|woman|samantha|karen|victoria|tessa|moira|fiona|serena|allison|ava|susan|zira|hazel|amelie|amélie|anna|paulina|milena|zosia|kyoko|ting|mei|google.*female|aria|nova|jenny|sonia|libby)/i;
const MALE = /(male|man|daniel|alex|fred|thomas|jorge|diego|yuri|rishi|aaron|david|mark|george|guy|onyx|kai|google.*male|liam|ryan|arthur)/i;

function guessGender(name: string): RenGender | null {
  if (FEMALE.test(name)) return "female";
  if (MALE.test(name)) return "male";
  return null;
}

/**
 * Resolve a Ren voice preset id to concrete `speak()` options — a real
 * `voiceURI` for this device when one fits, matched by language then character.
 */
export function renVoiceSpeakOpts(id: string | undefined | null): { voiceURI?: string } {
  const preset = renVoice(id);
  const voices = availableVoices();
  if (voices.length === 0) return {};

  const lang = (typeof navigator !== "undefined" ? navigator.language : "en") || "en";
  const base = lang.slice(0, 2).toLowerCase();

  const inLang = voices.filter((v) => v.lang?.toLowerCase().startsWith(base));
  const pool = inLang.length > 0 ? inLang : voices;

  // Score for a strong, clear, natural voice (not the old robotic ones): premium
  // engines and on-device neural voices sound best.
  const HQ = /(natural|neural|premium|enhanced|google|siri|samantha|aria|jenny|sonia|libby|eloquence)/i;
  const quality = (v: SpeechSynthesisVoice) => (HQ.test(v.name) ? 2 : 0) + (v.localService ? 1 : 0);
  const ranked = [...pool].sort((a, b) => quality(b) - quality(a));

  // Prefer the best-quality voice matching the preset's character; else the best
  // quality overall, so Ren always sounds clear and premium.
  const byGender = ranked.find((v) => guessGender(v.name) === preset.gender);
  const chosen = byGender ?? ranked[0];
  return chosen ? { voiceURI: chosen.voiceURI } : {};
}
