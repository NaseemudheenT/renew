import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOtpSchema } from "@/lib/validation/auth";
import { OTP_COOKIE, OTP_TTL_MS, verifyOtpToken } from "@/lib/otp";

export const runtime = "nodejs";

const REASON_MESSAGE: Record<string, string> = {
  invalid: "Your code has expired. Request a new one.",
  expired: "Your code has expired. Request a new one.",
  mismatch: "That code isn't right. Try again.",
  throttled: "Too many attempts. Request a new code.",
};

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = verifyOtpSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Enter the 6-digit code" }, { status: 422 });
  }

  const jar = await cookies();
  const token = jar.get(OTP_COOKIE)?.value;
  const { email, code } = parsed.data;

  const result = await verifyOtpToken(token, email, code);

  if (result.ok) {
    jar.delete(OTP_COOKIE);
    return NextResponse.json({ ok: true });
  }

  // Roll the cookie forward when the engine returns an updated token
  // (increments the attempt counter).
  if (result.token) {
    jar.set(OTP_COOKIE, result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(OTP_TTL_MS / 1000),
    });
  }

  return NextResponse.json(
    { ok: false, reason: result.reason, error: REASON_MESSAGE[result.reason] },
    { status: 400 },
  );
}
