/**
 * A small set of tasteful preset avatars — premium gradient "auras" a person can
 * pick without uploading a photo. Stored as an id on the profile; rendered as a
 * CSS gradient behind their initials.
 */

export interface AvatarPreset {
  id: string;
  css: string;
}

export const AVATARS: AvatarPreset[] = [
  { id: "aurora", css: "linear-gradient(135deg,#8b7cff,#4dd0e1)" },
  { id: "champagne", css: "linear-gradient(135deg,#f6d365,#fda085)" },
  { id: "sunset", css: "linear-gradient(135deg,#ff7eb3,#ff758c)" },
  { id: "ocean", css: "linear-gradient(135deg,#2af598,#009efd)" },
  { id: "violet", css: "linear-gradient(135deg,#a18cd1,#fbc2eb)" },
  { id: "forest", css: "linear-gradient(135deg,#0ba360,#3cba92)" },
  { id: "midnight", css: "linear-gradient(135deg,#5b86e5,#36096d)" },
  { id: "ember", css: "linear-gradient(135deg,#f83600,#fbb03b)" },
];

export function avatarGradient(id?: string | null): string | null {
  if (!id) return null;
  return AVATARS.find((a) => a.id === id)?.css ?? null;
}
