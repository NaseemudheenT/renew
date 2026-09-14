/**
 * A small set of tasteful preset avatars — premium gradient "auras" a person can
 * pick without uploading a photo. Stored as an id on the profile; rendered as a
 * CSS gradient behind their initials.
 */

export interface AvatarPreset {
  id: string;
  css: string;
}

// A small, curated set of PROFESSIONAL, muted tones — deep and premium, never
// neon (Apple-style). Each is a subtle same-family gradient for quiet depth.
export const AVATARS: AvatarPreset[] = [
  { id: "graphite", css: "linear-gradient(140deg,#3a3f4a,#1c1f26)" },
  { id: "navy", css: "linear-gradient(140deg,#2a3f5f,#141e30)" },
  { id: "champagne", css: "linear-gradient(140deg,#c6a052,#8a6a2e)" },
  { id: "slate", css: "linear-gradient(140deg,#586172,#2b3038)" },
  { id: "forest", css: "linear-gradient(140deg,#33564a,#18271f)" },
  { id: "plum", css: "linear-gradient(140deg,#4a3a5a,#271d33)" },
  { id: "indigo", css: "linear-gradient(140deg,#3b4079,#20234a)" },
  { id: "stone", css: "linear-gradient(140deg,#6a6862,#38362f)" },
];

export function avatarGradient(id?: string | null): string | null {
  if (!id) return null;
  return AVATARS.find((a) => a.id === id)?.css ?? null;
}
