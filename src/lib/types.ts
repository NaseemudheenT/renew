/**
 * Shared domain types used across client and server. Firestore timestamps are
 * normalised to epoch millis when they cross the client boundary.
 */

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  onboarded: boolean;
  timezone: string;
  /** ISO country/region or free text used to tailor reminder defaults. */
  focus?: string[];
  createdAt: number;
  updatedAt: number;
}
