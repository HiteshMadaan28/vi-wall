import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getAdminOverview, listParticipants } from "@/lib/admin-data";
import { getActivity } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Server-side authorization — never rely on the client hiding the page.
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("q");

  const [overview, participants, activity] = await Promise.all([
    getAdminOverview(),
    listParticipants(status, search),
    getActivity(15),
  ]);

  return NextResponse.json({ overview, participants, activity });
}
