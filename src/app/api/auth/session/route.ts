import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, destroySession } from "@/lib/auth/session";
import { ensureUserDoc } from "@/lib/firestore/users.server";

export const runtime = "nodejs";

const bodySchema = z.object({ idToken: z.string().min(20) });

/** Create a session cookie from a fresh Firebase ID token. */
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  try {
    const user = await createSession(parsed.data.idToken);
    await ensureUserDoc(user);
    return NextResponse.json({
      user: {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        displayName: user.displayName,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    const status = message === "stale-token" ? 401 : 500;
    return NextResponse.json(
      { error: "Could not establish a session. Please sign in again." },
      { status },
    );
  }
}

/** Sign out — clear the session cookie. */
export async function DELETE() {
  await destroySession();
  return NextResponse.json({ ok: true });
}
