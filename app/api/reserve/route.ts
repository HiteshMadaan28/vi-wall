import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { RESERVATION_MINUTES } from "@/lib/config";
import { WALL_CAPACITY } from "@/lib/data";

export const dynamic = "force-dynamic";

/**
 * Atomically reserve a specific available tile for ~10 minutes while the user
 * fills the form and verifies their email. The atomicity (one row updated or
 * none) lives in the Postgres `reserve_tile` function, so concurrent requests
 * for the same tile can never both succeed.
 */
export async function POST(request: Request) {
  const ip = clientIp(request.headers);
  const rl = rateLimit(`reserve:${ip}`, 20, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  let body: { tileIndex?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const tileIndex = Number(body.tileIndex);
  if (!Number.isInteger(tileIndex) || tileIndex < 0 || tileIndex >= WALL_CAPACITY) {
    return NextResponse.json({ error: "invalid_tile" }, { status: 400 });
  }

  const db = getAdminClient()!;
  const token = randomBytes(18).toString("hex");

  const { data, error } = await db.rpc("reserve_tile", {
    p_tile_index: tileIndex,
    p_token: token,
    p_minutes: RESERVATION_MINUTES,
  });

  if (error) {
    if (error.message.includes("tile_unavailable")) {
      return NextResponse.json(
        { error: "tile_unavailable", message: "That block was just taken. Pick another." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "reserve_failed" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    tileIndex,
    reservationToken: token,
    reservedUntil: data as string,
    expiresInMinutes: RESERVATION_MINUTES,
  });
}
