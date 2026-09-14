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
  { id: "ocean", css: "linear-gradient(140deg,#1c6f8c,#0d3a4c)" },
  { id: "burgundy", css: "linear-gradient(140deg,#7a3345,#3f1b26)" },
  { id: "teal", css: "linear-gradient(140deg,#2f7d72,#163d38)" },
  { id: "bronze", css: "linear-gradient(140deg,#a86b3c,#5c3a20)" },
  { id: "sky", css: "linear-gradient(140deg,#4b7fb0,#274a68)" },
  { id: "olive", css: "linear-gradient(140deg,#5b6236,#31351d)" },
  { id: "aubergine", css: "linear-gradient(140deg,#5a3a63,#2f1e35)" },
  { id: "steel", css: "linear-gradient(140deg,#4a5568,#262c38)" },
  { id: "rosegold", css: "linear-gradient(140deg,#c08a7d,#7a5149)" },
  { id: "midnight", css: "linear-gradient(140deg,#2b2f52,#14162b)" },
];

export function avatarGradient(id?: string | null): string | null {
  if (!id) return null;
  return AVATARS.find((a) => a.id === id)?.css ?? null;
}
