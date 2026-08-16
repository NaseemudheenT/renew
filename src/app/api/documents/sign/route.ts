import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { signUpload, isCloudinaryConfigured } from "@/lib/cloudinary";

export const runtime = "nodejs";

/** Return a signed, user-scoped Cloudinary upload payload. */
export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { error: "File storage isn't configured." },
      { status: 503 },
    );
  }
  return NextResponse.json(signUpload(user.uid));
}
