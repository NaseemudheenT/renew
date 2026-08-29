import "server-only";

import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

/** One row in the owner's people list — account + security metadata only. */
export interface OwnerUserRow {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  providers: string[];
  createdAt: number | null;
  lastSignInAt: number | null;
  emailVerified: boolean;
  disabled: boolean;
}

export interface OwnerOverview {
  totalUsers: number;
  onboardedUsers: number;
  newLast7d: number;
  newLast30d: number;
  activeLast24h: number;
  activeLast7d: number;
  disabledUsers: number;
  unverifiedUsers: number;
  /** How people sign in, e.g. { "google.com": 12, "passkey": 4, "password": 3 }. */
  providerBreakdown: Record<string, number>;
  /** Most recent sign-ups, newest first (capped). */
  recentUsers: OwnerUserRow[];
  /** True if we hit the pagination cap and the totals are a floor, not exact. */
  truncated: boolean;
  generatedAt: number;
}

const PAGE_SIZE = 1000; // Firebase Admin max per page.
const MAX_PAGES = 10; // Safety cap: up to 10k users per load.
const DAY = 24 * 60 * 60 * 1000;

function toMs(iso: string | undefined | null): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}

/**
 * Map a Firebase provider id to a friendly bucket. Passkey users authenticate
 * via a custom token (no providerData entry), so an account with a verified
 * passkey but no other provider is labelled "passkey"; a bare custom token with
 * nothing else is "other".
 */
function bucketProviders(providerIds: string[], hasPasskey: boolean): string[] {
  const out = new Set<string>();
  for (const id of providerIds) {
    if (id === "google.com") out.add("google.com");
    else if (id === "apple.com") out.add("apple.com");
    else if (id === "password") out.add("password");
    else if (id === "phone") out.add("phone");
    else out.add(id);
  }
  if (hasPasskey) out.add("passkey");
  if (out.size === 0) out.add("other");
  return [...out];
}

/**
 * Gather the owner console overview. Server-only; callers MUST have already
 * confirmed the requester is the owner. Reads Firebase Auth (the user list) and
 * cross-references the `users` and `passkeys` collections — never any financial
 * data.
 */
export async function getOwnerOverview(): Promise<OwnerOverview> {
  const auth = getAdminAuth();
  const now = Date.now();

  // Which uids have at least one registered passkey (for the provider bucket).
  const passkeyUids = new Set<string>();
  try {
    const snap = await getAdminDb().collection("passkeys").get();
    snap.forEach((doc) => {
      const uid = (doc.data()?.uid as string | undefined) ?? null;
      if (uid) passkeyUids.add(uid);
    });
  } catch {
    // Non-fatal — provider breakdown just won't show passkeys.
  }

  // Which uids have completed onboarding.
  let onboardedUsers = 0;
  const onboardedUids = new Set<string>();
  try {
    const snap = await getAdminDb().collection("users").where("onboarded", "==", true).get();
    snap.forEach((doc) => onboardedUids.add(doc.id));
    onboardedUsers = onboardedUids.size;
  } catch {
    // Non-fatal.
  }

  let totalUsers = 0;
  let newLast7d = 0;
  let newLast30d = 0;
  let activeLast24h = 0;
  let activeLast7d = 0;
  let disabledUsers = 0;
  let unverifiedUsers = 0;
  const providerBreakdown: Record<string, number> = {};
  const rows: OwnerUserRow[] = [];

  let pageToken: string | undefined;
  let pages = 0;
  let truncated = false;

  do {
    const res = await auth.listUsers(PAGE_SIZE, pageToken);
    for (const u of res.users) {
      totalUsers += 1;
      const createdAt = toMs(u.metadata.creationTime);
      const lastSignInAt = toMs(u.metadata.lastSignInTime);
      if (createdAt != null) {
        if (now - createdAt <= 7 * DAY) newLast7d += 1;
        if (now - createdAt <= 30 * DAY) newLast30d += 1;
      }
      if (lastSignInAt != null) {
        if (now - lastSignInAt <= DAY) activeLast24h += 1;
        if (now - lastSignInAt <= 7 * DAY) activeLast7d += 1;
      }
      if (u.disabled) disabledUsers += 1;
      if (!u.emailVerified) unverifiedUsers += 1;

      const buckets = bucketProviders(
        u.providerData.map((p) => p.providerId),
        passkeyUids.has(u.uid),
      );
      for (const b of buckets) providerBreakdown[b] = (providerBreakdown[b] ?? 0) + 1;

      rows.push({
        uid: u.uid,
        email: u.email ?? null,
        displayName: u.displayName ?? null,
        photoURL: u.photoURL ?? null,
        providers: buckets,
        createdAt,
        lastSignInAt,
        emailVerified: u.emailVerified,
        disabled: u.disabled,
      });
    }
    pageToken = res.pageToken;
    pages += 1;
    if (pageToken && pages >= MAX_PAGES) {
      truncated = true;
      break;
    }
  } while (pageToken);

  // Newest sign-ups first, capped for the UI.
  rows.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  const recentUsers = rows.slice(0, 50);

  return {
    totalUsers,
    onboardedUsers,
    newLast7d,
    newLast30d,
    activeLast24h,
    activeLast7d,
    disabledUsers,
    unverifiedUsers,
    providerBreakdown,
    recentUsers,
    truncated,
    generatedAt: now,
  };
}
