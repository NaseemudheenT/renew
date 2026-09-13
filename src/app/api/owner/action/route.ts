import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { isOwner } from "@/lib/auth/owner";
import { runOwnerAction } from "@/lib/owner/actions.server";

export const runtime = "nodejs";

const schema = z.object({
  uid: z.string().trim().min(1).max(128),
  action: z.enum(["disable", "enable", "grantPremium", "revokePremium", "signout"]),
});

/**
 * Owner admin actions — account/access/plan control only. Locked to the single
 * owner email; everyone else gets 404 (route existence hidden). The owner can't
 * lock or sign themselves out here (safety).
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || !isOwner(user)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  let json: unknown;
  try { json = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { uid, action } = parsed.data;

  if (uid === user.uid && (action === "disable" || action === "signout")) {
    return NextResponse.json({ error: "You can't lock your own account from here." }, { status: 400 });
  }

  try {
    await runOwnerAction(uid, action);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("owner/action failed", err);
    return NextResponse.json({ error: "Action failed." }, { status: 500 });
  }
}
