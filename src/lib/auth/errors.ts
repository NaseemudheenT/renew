/**
 * Map Firebase Auth error codes to calm, human messages. We never surface raw
 * Firebase codes to users.
 */
const MESSAGES: Record<string, string> = {
  "auth/invalid-email": "That email doesn't look right.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/user-not-found": "No account found with that email.",
  "auth/wrong-password": "That password isn't right.",
  "auth/invalid-credential": "That email or password isn't right.",
  "auth/email-already-in-use": "An account already exists with that email.",
  "auth/weak-password": "Please choose a stronger password.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/network-request-failed": "Network issue. Check your connection and try again.",
  "auth/popup-closed-by-user": "Sign-in was cancelled.",
  "auth/operation-not-allowed": "This sign-in method isn't enabled.",
};

export function authErrorMessage(err: unknown): string {
  const code =
    typeof err === "object" && err !== null && "code" in err
      ? String((err as { code: unknown }).code)
      : "";
  return MESSAGES[code] || "Something went wrong. Please try again.";
}

/** Firebase error code helper. */
export function authErrorCode(err: unknown): string {
  return typeof err === "object" && err !== null && "code" in err
    ? String((err as { code: unknown }).code)
    : "";
}
