import { NextResponse } from "next/server";
import { claimSchema } from "@/lib/validation";
import { getAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { getCountry } from "@/lib/countries";
import { normalizeUsername } from "@/lib/moderation";
import {
  generateVerificationToken,
  isEmailConfigured,
  sendVerificationEmail,
  verificationUrl,
} from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // --- rate limit: 5 claims / 10 min / IP -----------------------------------
  const ip = clientIp(request.headers);
  const rl = rateLimit(`claim:${ip}`, 5, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "rate_limited", message: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error: "not_configured",
        message:
          "The database isn't configured on this deployment yet. See README for Supabase setup.",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = claimSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const input = parsed.data;

  const country = getCountry(input.countryIso);
  if (!country) {
    return NextResponse.json(
      { error: "validation", issues: { countryIso: ["Select a valid country."] } },
      { status: 400 }
    );
  }

  const db = getAdminClient()!;

  const { data: countryRow, error: countryErr } = await db
    .from("countries")
    .select("id")
    .eq("iso_code", country.iso)
    .maybeSingle();
  if (countryErr || !countryRow) {
    return NextResponse.json({ error: "country_lookup_failed" }, { status: 500 });
  }

  const usernameNormalized = normalizeUsername(input.username);
  const emailNormalized = input.email.trim().toLowerCase();
  const token = generateVerificationToken();

  // Insert as pending_verification. UNIQUE constraints on username_normalized
  // and email_normalized are the real guard against duplicates (race-safe).
  const { error: insertErr } = await db
    .from("participants")
    .insert({
      username: input.username.trim(),
      username_normalized: usernameNormalized,
      email: input.email.trim(),
      email_normalized: emailNormalized,
      country_id: (countryRow as { id: number }).id,
      avatar: input.avatar,
      message: input.message?.trim() || null,
      social_url: input.socialUrl?.trim() || null,
      status: "pending_verification",
      verification_token: token,
      verification_sent_at: new Date().toISOString(),
    });

  if (insertErr) {
    // 23505 = unique_violation
    if (insertErr.code === "23505") {
      const dup = insertErr.message.includes("email")
        ? "An account with this email already exists."
        : "That username is already taken.";
      return NextResponse.json({ error: "duplicate", message: dup }, { status: 409 });
    }
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }

  // --- send verification email (or report that it isn't configured) ----------
  const emailResult = await sendVerificationEmail(emailNormalized, token);

  const devMode = !isEmailConfigured();
  return NextResponse.json(
    {
      ok: true,
      status: "pending_verification",
      emailSent: emailResult.sent,
      emailConfigured: emailResult.configured,
      // Only exposed when email delivery isn't configured, so a claim can still
      // be completed in local/dev setups. Clearly labelled, never in prod use.
      devVerifyUrl: devMode ? verificationUrl(token) : undefined,
      message: emailResult.sent
        ? "Check your inbox to verify your email and claim your tile."
        : "Your claim is pending. Email verification isn't configured on this deployment.",
    },
    { status: 201 }
  );
}
