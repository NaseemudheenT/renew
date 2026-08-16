import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { verifyOtp } from "@/lib/auth/otp";
import { markEmailVerified } from "@/lib/firestore/users.server";

export const runtime = "nodejs";

const bodySchema = z.object({ code: z.string().regex(/^\d{6}$/) });

/** Verify a submitted 6-digit code and mark the user's email verified. */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (user.emailVerified) {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter the 6-digit code." },
      { status: 400 },
    );
  }

  const result = await verifyOtp(user.uid, parsed.data.code);
  if (!result.ok) {
    const messages: Record<string, string> = {
      expired: "That code has expired. Request a new one.",
      invalid:
        result.attemptsLeft !== undefined
          ? `That code isn't right. ${result.attemptsLeft} attempt${result.attemptsLeft === 1 ? "" : "s"} left.`
          : "That code isn't right.",
      "too-many-attempts": "Too many attempts. Request a new code.",
      "not-found": "No active code. Request a new one.",
    };
    return NextResponse.json(
      { error: messages[result.error ?? "invalid"] ?? "Verification failed." },
      { status: 400 },
    );
  }

  await markEmailVerified(user.uid);
  return NextResponse.json({ ok: true });
}
