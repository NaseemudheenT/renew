import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { isOwner } from "@/lib/auth/owner";
import { getOwnerOverview } from "@/lib/owner/overview.server";

export const runtime = "nodejs";

/**
 * Owner console data. Locked to the single owner email — every other session
 * (signed-in or not) gets 404 so the route's existence isn't even revealed.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user || !isOwner(user)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  try {
    const overview = await getOwnerOverview();
    return NextResponse.json(overview, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("owner/overview failed", err);
    return NextResponse.json({ error: "Could not load overview." }, { status: 500 });
  }
}
