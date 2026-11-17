import "server-only";
import { cookies } from "next/headers";
import {
  createSessionToken,
  verifySessionToken,
  constantTimePasswordMatch,
  SESSION_TTL_MS,
} from "./token";

/**
 * Minimal admin authentication for Phase One.
 *
 * Rather than requiring a full Supabase Auth setup, the admin area is gated by
 * a shared ADMIN_PASSWORD. A successful login sets a signed, HttpOnly cookie
 * (HMAC-signed with ADMIN_SESSION_SECRET). Authorization is always checked
 * server-side; hiding UI is never the protection. This is intentionally simple
 * and documented as such; the admin_users table exists so this can grow into
 * real role-based Supabase Auth later without schema changes.
 */

const COOKIE_NAME = "vw_admin";

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET || "";
}

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET);
}

export function verifyPassword(attempt: string): boolean {
  return constantTimePasswordMatch(attempt, process.env.ADMIN_PASSWORD || "");
}

export async function createAdminSession(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, createSessionToken(secret()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function destroyAdminSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  return verifySessionToken(jar.get(COOKIE_NAME)?.value, secret());
}
