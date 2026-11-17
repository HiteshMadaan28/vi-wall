import { NextResponse } from "next/server";
import { reportSchema } from "@/lib/validation";
import { getAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { normalizeUsername } from "@/lib/moderation";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Report a participant for moderation. Logged as an activity event for the
 *  admin queue; never exposes whether the reported user exists. */
export async function POST(request: Request) {
  const ip = clientIp(request.headers);
  const rl = rateLimit(`report:${ip}`, 10, 10 * 60 * 1000);
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

  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  const db = getAdminClient()!;
  const normalized = normalizeUsername(parsed.data.username);

  const { data: target } = await db
    .from("participants")
    .select("id, country_id")
    .eq("username_normalized", normalized)
    .maybeSingle();

  await db.from("activity_events").insert({
    event_type: "report_submitted",
    participant_id: (target as { id: string } | null)?.id ?? null,
    country_id: (target as { country_id: number } | null)?.country_id ?? null,
    metadata: { reason: parsed.data.reason.slice(0, 500), username: parsed.data.username },
  });

  // Always the same response, whether or not the user exists.
  return NextResponse.json({ ok: true, message: "Thanks. Our moderators will review this." });
}
