import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import {
  CHALLENGE_COOKIE,
  rpFromRequest,
  readChallengeCookie,
  getPasskey,
  bumpPasskeyCounter,
  toWebAuthnCredential,
} from "@/lib/auth/passkey";

export const runtime = "nodejs";

/** Verify the passkey assertion, then mint a Firebase custom token so the client
 *  can complete sign-in and establish the httpOnly session. */
export async function POST(request: Request) {
  const store = await cookies();
  const challenge = readChallengeCookie(store.get(CHALLENGE_COOKIE)?.value);
  if (!challenge) {
    return NextResponse.json({ error: "Sign-in expired. Please try again." }, { status: 400 });
  }

  let body: { response?: AuthenticationResponseJSON };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!body.response) {
    return NextResponse.json({ error: "Missing passkey response." }, { status: 400 });
  }

  const passkey = await getPasskey(body.response.id);
  if (!passkey) {
    return NextResponse.json({ error: "Passkey not recognised." }, { status: 400 });
  }

  const { rpID, origin } = rpFromRequest(request);
  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: body.response,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: toWebAuthnCredential(passkey),
      requireUserVerification: false,
    });
  } catch {
    return NextResponse.json({ error: "Could not verify the passkey." }, { status: 400 });
  }
  if (!verification.verified) {
    return NextResponse.json({ error: "Passkey could not be verified." }, { status: 400 });
  }

  await bumpPasskeyCounter(
    passkey.credentialID,
    verification.authenticationInfo.newCounter,
  );

  const token = await getAdminAuth().createCustomToken(passkey.uid);
  const res = NextResponse.json({ token });
  res.cookies.set(CHALLENGE_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
