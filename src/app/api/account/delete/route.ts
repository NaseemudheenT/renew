import { NextResponse } from "next/server";
import { getSessionUser, destroySession } from "@/lib/auth/session";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { destroyAsset } from "@/lib/cloudinary";

export const runtime = "nodejs";

const SUBCOLLECTIONS = [
  "reminders",
  "tasks",
  "documents",
  "payments",
  "notifications",
] as const;

/**
 * Permanently delete the signed-in user's account and all their data:
 * Cloudinary assets, every subcollection, the profile doc, the OTP doc, and the
 * Firebase Auth user — then clear the session. Scoped to the session uid.
 */
export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const db = getAdminDb();
  const userRef = db.collection("users").doc(user.uid);

  try {
    for (const name of SUBCOLLECTIONS) {
      const snap = await userRef.collection(name).get();
      if (name === "documents") {
        await Promise.all(
          snap.docs.map((d) => {
            const publicId = d.data()?.publicId as string | undefined;
            return publicId ? destroyAsset(publicId) : Promise.resolve();
          }),
        );
      }
      // Delete in batches of 400 (under the 500 write limit).
      for (let i = 0; i < snap.docs.length; i += 400) {
        const batch = db.batch();
        snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    }

    await userRef.delete().catch(() => {});
    await db.collection("emailOtps").doc(user.uid).delete().catch(() => {});
    await getAdminAuth().deleteUser(user.uid);
    await destroySession();

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Could not fully delete the account. Please try again." },
      { status: 500 },
    );
  }
}
