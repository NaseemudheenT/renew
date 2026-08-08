import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sendOtpSchema } from "@/lib/validation/auth";
import { createOtpToken, generateCode, OTP_COOKIE, OTP_TTL_MS } from "@/lib/otp";
import { getResend, getFromAddress, isResendConfigured } from "@/lib/resend";
import { otpEmail } from "@/lib/email/templates";
import { clientEnv } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = sendOtpSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email" }, { status: 422 });
  }

  const email = parsed.data.email.toLowerCase();
  const code = generateCode();
  const token = await createOtpToken(email, code);

  // Persist the signed token in an HttpOnly cookie (no DB needed).
  const jar = await cookies();
  jar.set(OTP_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(OTP_TTL_MS / 1000),
  });

  const logoUrl = clientEnv.appUrl ? `${clientEnv.appUrl.replace(/\/$/, "")}/icon` : undefined;
  const { subject, html, text } = otpEmail(code, logoUrl);
  let delivered = false;

  if (isResendConfigured()) {
    try {
      const result = await getResend().emails.send({
        from: getFromAddress(),
        to: email,
        subject,
        html,
        text,
      });
      delivered = !result.error;
      if (result.error) console.error("[otp/send] Resend error:", result.error);
    } catch (err) {
      console.error("[otp/send] Resend threw:", err);
    }
  }

  // In development, surface the code so the flow is testable without a
  // verified sending domain. NEVER exposed in production.
  const devHint =
    process.env.NODE_ENV !== "production" && !delivered
      ? { devCode: code, note: "Email not delivered (dev). Using devCode to continue." }
      : {};

  if (process.env.NODE_ENV !== "production") {
    console.info(`[otp/send] code for ${email}: ${code} (delivered=${delivered})`);
  }

  return NextResponse.json({ ok: true, delivered, ...devHint });
}
