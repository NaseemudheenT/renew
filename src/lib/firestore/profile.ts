import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import type { UserProfile } from "./types";

function profileRef(uid: string) {
  return doc(getDb(), "users", uid);
}

export async function getProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(profileRef(uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export function subscribeProfile(uid: string, cb: (profile: UserProfile | null) => void) {
  return onSnapshot(
    profileRef(uid),
    (snap) => cb(snap.exists() ? (snap.data() as UserProfile) : null),
    (err) => {
      console.error("[profile] subscription error:", err.code || err.message);
      cb(null);
    },
  );
}

/** Create or merge the user's profile. */
export async function saveProfile(uid: string, patch: Partial<UserProfile>) {
  await setDoc(profileRef(uid), { ...patch, updatedAt: Date.now() }, { merge: true });
}
