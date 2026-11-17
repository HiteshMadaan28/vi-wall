import { NextResponse } from "next/server";
import { getCountryParticipants } from "@/lib/data";
import { isValidCountry } from "@/lib/countries";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ iso: string }> }
) {
  const { iso } = await params;
  if (!isValidCountry(iso)) {
    return NextResponse.json({ error: "unknown_country" }, { status: 404 });
  }
  const players = await getCountryParticipants(iso);
  return NextResponse.json({ players });
}
