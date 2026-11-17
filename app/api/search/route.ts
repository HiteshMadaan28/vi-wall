import { NextResponse } from "next/server";
import { searchParticipants } from "@/lib/data";
import { searchSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = searchSchema.safeParse({ q: searchParams.get("q") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ results: [] });
  }
  const results = await searchParticipants(parsed.data.q);
  return NextResponse.json({ results });
}
