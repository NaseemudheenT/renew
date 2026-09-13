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
  // Extended premium set — deeper, richer, more "aura" range.
  { id: "royal", css: "linear-gradient(135deg,#7028e4,#e5b2ca)" },
  { id: "gold", css: "linear-gradient(135deg,#b78628,#f7ef8a,#8a6a2e)" },
  { id: "rose", css: "linear-gradient(135deg,#ee9ca7,#ffdde1)" },
  { id: "teal", css: "linear-gradient(135deg,#0f2027,#2c5364)" },
  { id: "cosmic", css: "linear-gradient(135deg,#360033,#0b8793)" },
  { id: "coral", css: "linear-gradient(135deg,#ff512f,#dd2476)" },
  { id: "mint", css: "linear-gradient(135deg,#00b09b,#96c93d)" },
  { id: "sapphire", css: "linear-gradient(135deg,#141e30,#243b55)" },
  { id: "peach", css: "linear-gradient(135deg,#ffecd2,#fcb69f)" },
  { id: "aurora2", css: "linear-gradient(135deg,#00c6ff,#0072ff)" },
  { id: "plum", css: "linear-gradient(135deg,#3a1c71,#d76d77,#ffaf7b)" },
  { id: "slate", css: "linear-gradient(135deg,#232526,#414345)" },
  // Premium iridescent set — richer, jewel-like auras.
  { id: "iris", css: "linear-gradient(135deg,#4a7bff,#c05cff,#ff9d6c)" },
  { id: "lagoon", css: "linear-gradient(135deg,#43e97b,#38f9d7)" },
  { id: "flare", css: "linear-gradient(135deg,#fa709a,#fee140)" },
  { id: "cobalt", css: "linear-gradient(135deg,#2b32b2,#1488cc)" },
  { id: "orchid", css: "linear-gradient(135deg,#b24592,#f15f79)" },
  { id: "aurora3", css: "linear-gradient(135deg,#00dbde,#fc00ff)" },
  { id: "moss", css: "linear-gradient(135deg,#134e5e,#71b280)" },
  { id: "dawn", css: "linear-gradient(135deg,#ff6a88,#ff99ac,#fbc2eb)" },
  { id: "steelrose", css: "linear-gradient(135deg,#8e9eab,#eef2f3)" },
  { id: "nebula", css: "linear-gradient(135deg,#654ea3,#eaafc8)" },
  { id: "ink", css: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)" },
  { id: "citrus", css: "linear-gradient(135deg,#f7971e,#ffd200)" },
];

export function avatarGradient(id?: string | null): string | null {
  if (!id) return null;
  return AVATARS.find((a) => a.id === id)?.css ?? null;
}
