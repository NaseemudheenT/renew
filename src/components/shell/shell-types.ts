export interface ShellUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

/** Two-letter initials for the avatar fallback. */
export function initialsOf(user: ShellUser): string {
  const source = user.displayName?.trim() || user.email || "";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return (source.slice(0, 2) || "R").toUpperCase();
}
