import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

/**
 * Pure, dependency-light signing helpers for the admin session cookie.
 * Kept separate from auth.ts (which is server-only and touches next/headers)
 * so the signing/verification logic can be unit tested directly.
 */

export const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function createSessionToken(secret: string, now = Date.now()): string {
  const expires = now + SESSION_TTL_MS;
  const nonce = randomBytes(8).toString("hex");
  const payload = `${expires}.${nonce}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySessionToken(
  token: string | undefined,
  secret: string,
  now = Date.now()
): boolean {
  if (!token || !secret) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [expiresStr, nonce, sig] = parts;
  const payload = `${expiresStr}.${nonce}`;
  if (!safeEqual(sig, sign(payload, secret))) return false;
  const expires = Number.parseInt(expiresStr, 10);
  return Number.isFinite(expires) && expires > now;
}

export function constantTimePasswordMatch(attempt: string, expected: string): boolean {
  if (!expected) return false;
  return safeEqual(attempt, expected);
}
