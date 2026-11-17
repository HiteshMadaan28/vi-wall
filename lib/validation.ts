/**
 * Zod schemas for all input that crosses a trust boundary.
 *
 * The same schema is used on the client (react-hook-form) and the server (API
 * routes), but the server always re-validates — client validation is a
 * convenience, never the gate.
 */

import { z } from "zod";
import {
  MESSAGE_MAX_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from "./config";
import { containsProfanity } from "./moderation";

export const AVATAR_PRESETS = [
  "neon-fox",
  "cyber-skull",
  "violet-orb",
  "pink-bolt",
  "blue-wave",
  "ghost",
  "diamond",
  "crown",
] as const;

export type AvatarPreset = (typeof AVATAR_PRESETS)[number];

const usernameSchema = z
  .string()
  .trim()
  .min(USERNAME_MIN_LENGTH, `At least ${USERNAME_MIN_LENGTH} characters.`)
  .max(USERNAME_MAX_LENGTH, `At most ${USERNAME_MAX_LENGTH} characters.`)
  .regex(/^[a-zA-Z0-9_.-]+$/, "Letters, numbers, and _ . - only.")
  .refine((v) => !containsProfanity(v), "That username isn't allowed.");

const socialUrlSchema = z
  .string()
  .trim()
  .max(200, "Link is too long.")
  .url("Enter a valid URL.")
  .refine(
    (v) => {
      try {
        const u = new URL(v);
        return u.protocol === "http:" || u.protocol === "https:";
      } catch {
        return false;
      }
    },
    "Only http(s) links are allowed."
  )
  .optional()
  .or(z.literal(""));

/** Fields the user fills in the claim form (no tile/token). */
export const claimFormSchema = z.object({
  username: usernameSchema,
  email: z.string().trim().email("Enter a valid email.").max(254),
  countryIso: z
    .string()
    .trim()
    .length(2, "Select a country.")
    .transform((v) => v.toUpperCase()),
  message: z
    .string()
    .trim()
    .max(MESSAGE_MAX_LENGTH, `At most ${MESSAGE_MAX_LENGTH} characters.`)
    .refine((v) => !containsProfanity(v), "Please keep your message clean.")
    .optional()
    .or(z.literal("")),
  avatar: z.enum(AVATAR_PRESETS).default("violet-orb"),
  socialUrl: socialUrlSchema,
});

/** Full payload the server validates: form fields + the chosen block. */
export const claimSchema = claimFormSchema.extend({
  tileIndex: z.number().int().nonnegative(),
  reservationToken: z.string().trim().min(10).max(80),
});

/** Full server payload type (form + tile) — what the API receives. */
export type ClaimInput = z.output<typeof claimSchema>;
/** Form field input type (before defaults) — what the form holds. */
export type ClaimFormValues = z.input<typeof claimFormSchema>;
/** Form field output type (after defaults) — what handleSubmit returns. */
export type ClaimFormOutput = z.output<typeof claimFormSchema>;

export const verifySchema = z.object({
  token: z.string().trim().min(10).max(200),
});

export const reportSchema = z.object({
  username: z.string().trim().min(1).max(USERNAME_MAX_LENGTH),
  reason: z.string().trim().min(5, "Tell us a little more.").max(500),
});

export const searchSchema = z.object({
  q: z.string().trim().min(1).max(50),
});
