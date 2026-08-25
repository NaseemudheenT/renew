export interface ShellUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

/** Single first-letter initial for the avatar (e.g. "N"). Clean and premium. */
export function initialsOf(user: ShellUser): string {
  const source = user.displayName?.trim() || user.email || "";
  return (source.slice(0, 1) || "R").toUpperCase();
}
