import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { getAdminDb } from "@/lib/firebase/admin";
import { destroyAsset } from "@/lib/cloudinary";

export const runtime = "nodejs";

const bodySchema = z.object({ id: z.string().min(1) });

/**
 * Delete a document the user owns: remove the Cloudinary asset, then the
 * Firestore metadata. Ownership is enforced by scoping to the session uid.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing document id." }, { status: 400 });
  }

  const ref = getAdminDb()
    .collection("users")
    .doc(user.uid)
    .collection("documents")
    .doc(parsed.data.id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const publicId = snap.data()?.publicId as string | undefined;
  if (publicId) await destroyAsset(publicId);
  await ref.delete();

  return NextResponse.json({ ok: true });
}
