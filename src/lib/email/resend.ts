import "server-only";

import { Resend } from "resend";
import { getServerEnv, isProd } from "@/lib/env";

let client: Resend | null = null;

function getResend(): Resend | null {
  const { apiKey } = getServerEnv().resend;
  if (!apiKey) return null;
  client ??= new Resend(apiKey);
  return client;
}

export interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Send a transactional email. Returns true when accepted. When Resend isn't
 * configured we fail loudly in production but degrade gracefully in dev
 * (the caller logs OTP codes to the server console so the flow stays testable).
 */
export async function sendEmail(args: SendEmailArgs): Promise<boolean> {
  const resend = getResend();
  const from = getServerEnv().resend.fromEmail || "Renew <onboarding@resend.dev>";

  if (!resend) {
    if (isProd) throw new Error("RESEND_API_KEY is not configured.");
    return false;
  }

  const { error } = await resend.emails.send({
    from,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
  });
  if (error) {
    if (isProd) throw new Error(`Resend error: ${error.message}`);
    return false;
  }
  return true;
}
