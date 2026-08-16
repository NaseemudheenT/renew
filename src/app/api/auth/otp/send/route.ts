import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { issueOtp } from "@/lib/auth/otp";
import { sendEmail } from "@/lib/email/resend";
import { otpEmail } from "@/lib/email/templates";
import { isDev } from "@/lib/env";

export const runtime = "nodejs";

/** Generate + email a fresh verification code to the signed-in user. */
export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (user.emailVerified) {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }
  if (!user.email) {
    return NextResponse.json(
      { error: "No email on file for this account." },
      { status: 400 },
    );
  }

  const result = await issueOtp(user.uid);
  if (!result.ok || !result.code) {
    const status = result.error === "cooldown" ? 429 : 429;
    return NextResponse.json(
      {
        error:
          result.error === "cooldown"
            ? "Please wait a moment before requesting another code."
            : "Too many codes requested. Try again later.",
        retryAfterMs: result.retryAfterMs,
      },
      { status },
    );
  }

  const { subject, html, text } = otpEmail(result.code, user.displayName);
  const delivered = await sendEmail({ to: user.email, subject, html, text });

  if (!delivered && isDev) {
    // Dev fallback so the flow is testable without a live Resend key.
    console.info(`\n🔐 Renew OTP for ${user.email}: ${result.code}\n`);
  }

  return NextResponse.json({ ok: true, delivered });
}
