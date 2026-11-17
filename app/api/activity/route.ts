import { NextResponse } from "next/server";
import { getActivity } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 20), 1), 50);
  const events = await getActivity(limit);
  return NextResponse.json(
    { events },
    { headers: { "Cache-Control": "public, s-maxage=5, stale-while-revalidate=15" } }
  );
}
