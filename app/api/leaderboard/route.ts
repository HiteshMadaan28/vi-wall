import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(Math.max(Number(limitParam), 1), 100) : undefined;
  const countries = await getLeaderboard(limit);
  return NextResponse.json(
    { countries },
    { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" } }
  );
}
