import { NextResponse } from "next/server";
import { getProfile } from "@/lib/data";
import { normalizeUsername } from "@/lib/moderation";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const profile = await getProfile(normalizeUsername(username));
  if (!profile) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ profile });
}
