import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { completeOnboarding } from "@/lib/firestore/users.server";

export const runtime = "nodejs";

const bodySchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  timezone: z.string().trim().min(1).max(64),
  focus: z.array(z.string().min(1).max(40)).max(12),
  locale: z.string().trim().min(2).max(8).optional(),
  region: z.string().trim().min(2).max(3).optional(),
  currency: z.string().trim().length(3).optional(),
  weekStart: z.union([z.literal(0), z.literal(1)]).optional(),
  hour12: z.boolean().optional(),
  accountType: z.enum(["personal", "business", "both"]).optional(),
});

/** Persist minimal onboarding answers and flip the onboarded flag. */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (!user.emailVerified) {
    return NextResponse.json(
      { error: "Verify your email first." },
      { status: 403 },
    );
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
      { error: "Please complete the required fields." },
      { status: 400 },
    );
  }

  await completeOnboarding(user.uid, parsed.data);
  return NextResponse.json({ ok: true });
}
