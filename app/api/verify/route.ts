import { NextResponse } from "next/server";
import { verifySchema } from "@/lib/validation";
import { getAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { getLeaderboard } from "@/lib/data";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function autoApprove(): boolean {
  // default true for Phase One; set AUTO_APPROVE_CLAIMS=false to require admin
  return process.env.AUTO_APPROVE_CLAIMS !== "false";
}

export async function POST(request: Request) {
  const ip = clientIp(request.headers);
  const rl = rateLimit(`verify:${ip}`, 20, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }

  const db = getAdminClient()!;

  // Atomic verify + tile allocation. Concurrency and double-allocation safety
  // live inside this Postgres function (SELECT ... FOR UPDATE SKIP LOCKED).
  const { data, error } = await db.rpc("verify_and_allocate", {
    p_token: parsed.data.token,
    p_auto_approve: autoApprove(),
  });

  if (error) {
    const map: Record<string, { status: number; message: string }> = {
      invalid_token: { status: 404, message: "This verification link is invalid or already used." },
      already_verified: { status: 409, message: "This tile has already been verified." },
      wall_full: { status: 409, message: "The wall is currently full. No tiles are available." },
    };
    const known = Object.keys(map).find((k) => error.message.includes(k));
    if (known) {
      return NextResponse.json({ error: known, message: map[known].message }, { status: map[known].status });
    }
    return NextResponse.json({ error: "verify_failed" }, { status: 500 });
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return NextResponse.json({ error: "invalid_token" }, { status: 404 });
  }

  // leaderboard position of their country, for the success screen
  const leaderboard = await getLeaderboard();
  const countryRank =
    leaderboard.find((c) => c.iso === row.out_country_iso)?.rank ?? null;

  return NextResponse.json({
    ok: true,
    username: row.out_username,
    status: row.out_status,
    tileIndex: row.out_tile_index,
    x: row.out_x,
    y: row.out_y,
    countryIso: row.out_country_iso,
    countryRank,
    autoApproved: autoApprove(),
  });
}
