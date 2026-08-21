import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import {
  CHALLENGE_COOKIE,
  rpFromRequest,
  makeChallengeCookie,
} from "@/lib/auth/passkey";
import { isProd } from "@/lib/env";

export const runtime = "nodejs";

/** Authentication options — discoverable, so the device offers the user's own
 *  Renew passkeys (Face ID / Touch ID). No account identifier needed up front. */
export async function POST(request: Request) {
  const { rpID } = rpFromRequest(request);
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "preferred",
    allowCredentials: [],
  });

  const res = NextResponse.json(options);
  res.cookies.set(CHALLENGE_COOKIE, makeChallengeCookie(options.challenge), {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: 300,
  });
  return res;
}
