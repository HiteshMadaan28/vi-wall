import { describe, it, expect } from "vitest";
import { claimSchema, reportSchema } from "@/lib/validation";
import {
  validateUsername,
  validateSocialUrl,
  validateMessage,
  containsProfanity,
  normalizeUsername,
} from "@/lib/moderation";

describe("claimSchema", () => {
  const valid = {
    username: "night_rider",
    email: "player@example.com",
    countryIso: "in",
    message: "Let's go India!",
    avatar: "violet-orb" as const,
    socialUrl: "https://twitter.com/me",
    tileIndex: 42,
    reservationToken: "abcdef1234567890",
  };

  it("accepts valid input and upper-cases the country", () => {
    const parsed = claimSchema.parse(valid);
    expect(parsed.countryIso).toBe("IN");
  });

  it("rejects an invalid email", () => {
    expect(claimSchema.safeParse({ ...valid, email: "nope" }).success).toBe(false);
  });

  it("rejects an invalid username character", () => {
    expect(claimSchema.safeParse({ ...valid, username: "bad name!" }).success).toBe(false);
  });

  it("rejects a non-http social url", () => {
    expect(
      claimSchema.safeParse({ ...valid, socialUrl: "javascript:alert(1)" }).success
    ).toBe(false);
  });

  it("allows an empty social url", () => {
    expect(claimSchema.safeParse({ ...valid, socialUrl: "" }).success).toBe(true);
  });
});

describe("reportSchema", () => {
  it("requires a reason of at least 5 characters", () => {
    expect(reportSchema.safeParse({ username: "x", reason: "bad" }).success).toBe(false);
  });
});

describe("moderation helpers", () => {
  it("catches profanity including simple leetspeak", () => {
    expect(containsProfanity("sh1t")).toBe(true);
    expect(containsProfanity("hello world")).toBe(false);
  });

  it("validates username length and charset", () => {
    expect(validateUsername("ab").ok).toBe(false);
    expect(validateUsername("good_name").ok).toBe(true);
  });

  it("rejects dangerous url protocols", () => {
    expect(validateSocialUrl("data:text/html,x").ok).toBe(false);
    expect(validateSocialUrl("https://ok.com").ok).toBe(true);
    expect(validateSocialUrl("").ok).toBe(true);
  });

  it("enforces message length", () => {
    expect(validateMessage("x".repeat(500), 140).ok).toBe(false);
  });

  it("normalises usernames case-insensitively", () => {
    expect(normalizeUsername("  NightRider ")).toBe("nightrider");
  });
});
