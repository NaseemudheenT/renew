import { NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { getSessionUser } from "@/lib/auth/session";
import {
  RP_NAME,
  CHALLENGE_COOKIE,
  rpFromRequest,
  makeChallengeCookie,
  getUserPasskeys,
} from "@/lib/auth/passkey";
import { isProd } from "@/lib/env";

export const runtime = "nodejs";

/** Registration options — the signed-in user is adding a passkey to their account. */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const { rpID } = rpFromRequest(request);
  const existing = await getUserPasskeys(user.uid);

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    userID: new TextEncoder().encode(user.uid),
    userName: user.email ?? user.displayName ?? user.uid,
    userDisplayName: user.displayName ?? user.email ?? "Renew",
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
    excludeCredentials: existing.map((c) => ({
      id: c.credentialID,
      transports: c.transports,
    })),
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
