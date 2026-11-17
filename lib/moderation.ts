/**
 * Lightweight, dependency-free content moderation.
 *
 * This is a first line of defence (format rules + a small profanity screen),
 * not a replacement for human moderation. Admins can still reject/remove
 * anything that slips through.
 */

import { USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH } from "./config";

// Small, deliberately conservative blocklist of substrings. Kept short on
// purpose; the admin queue is the real safety net.
const PROFANITY = [
  "fuck",
  "shit",
  "bitch",
  "cunt",
  "nigger",
  "nigga",
  "faggot",
  "retard",
  "rape",
  "slut",
  "whore",
];

/** Collapse common letter->symbol substitutions so "sh1t" is still caught. */
function normalizeForProfanity(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/@/g, "a")
    .replace(/\$/g, "s");
}

export function containsProfanity(text: string): boolean {
  if (!text) return false;
  const normalized = normalizeForProfanity(text);
  return PROFANITY.some((word) => normalized.includes(word));
}

/** Normalised username used for the uniqueness check (case-insensitive). */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export interface ValidationResult {
  ok: boolean;
  error?: string;
}

export function validateUsername(raw: string): ValidationResult {
  const username = raw.trim();
  if (username.length < USERNAME_MIN_LENGTH) {
    return { ok: false, error: `Username must be at least ${USERNAME_MIN_LENGTH} characters.` };
  }
  if (username.length > USERNAME_MAX_LENGTH) {
    return { ok: false, error: `Username must be at most ${USERNAME_MAX_LENGTH} characters.` };
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
    return { ok: false, error: "Username may only contain letters, numbers, and _ . -" };
  }
  if (containsProfanity(username)) {
    return { ok: false, error: "That username isn't allowed." };
  }
  return { ok: true };
}

/**
 * Validate an optional social URL. Only http(s) is permitted and the value
 * must parse as a URL; this prevents javascript: and data: payloads.
 */
export function validateSocialUrl(raw: string | null | undefined): ValidationResult {
  if (!raw) return { ok: true };
  const value = raw.trim();
  if (value.length === 0) return { ok: true };
  if (value.length > 200) return { ok: false, error: "Link is too long." };
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, error: "Enter a valid URL." };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, error: "Only http(s) links are allowed." };
  }
  return { ok: true };
}

export function validateMessage(raw: string | null | undefined, maxLength: number): ValidationResult {
  if (!raw) return { ok: true };
  const value = raw.trim();
  if (value.length > maxLength) {
    return { ok: false, error: `Message must be at most ${maxLength} characters.` };
  }
  if (containsProfanity(value)) {
    return { ok: false, error: "Please keep your message clean." };
  }
  return { ok: true };
}
