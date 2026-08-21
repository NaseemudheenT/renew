import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { getSessionUser } from "@/lib/auth/session";
import {
  CHALLENGE_COOKIE,
  rpFromRequest,
  readChallengeCookie,
  savePasskey,
  publicKeyToString,
} from "@/lib/auth/passkey";

export const runtime = "nodejs";

/** Verify the registration attestation and store the new passkey credential. */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const store = await cookies();
  const challenge = readChallengeCookie(store.get(CHALLENGE_COOKIE)?.value);
  if (!challenge) {
    return NextResponse.json({ error: "Setup expired. Please try again." }, { status: 400 });
  }

  let body: { response?: RegistrationResponseJSON };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!body.response) {
    return NextResponse.json({ error: "Missing passkey response." }, { status: 400 });
  }

  const { rpID, origin } = rpFromRequest(request);
  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body.response,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false,
    });
  } catch {
    return NextResponse.json({ error: "Could not verify the passkey." }, { status: 400 });
  }
  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: "Passkey could not be verified." }, { status: 400 });
  }

  const cred = verification.registrationInfo.credential;
  await savePasskey({
    credentialID: cred.id,
    uid: user.uid,
    publicKey: publicKeyToString(cred.publicKey),
    counter: cred.counter,
    transports: cred.transports,
    createdAt: Date.now(),
  });

  const res = NextResponse.json({ verified: true });
  res.cookies.set(CHALLENGE_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
