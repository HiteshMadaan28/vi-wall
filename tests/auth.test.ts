import { describe, it, expect } from "vitest";
import {
  createSessionToken,
  verifySessionToken,
  constantTimePasswordMatch,
  SESSION_TTL_MS,
} from "@/lib/token";

const SECRET = "test-secret-0123456789";

describe("admin session tokens (authorization)", () => {
  it("verifies a freshly signed token", () => {
    const token = createSessionToken(SECRET);
    expect(verifySessionToken(token, SECRET)).toBe(true);
  });

  it("rejects a token signed with a different secret", () => {
    const token = createSessionToken(SECRET);
    expect(verifySessionToken(token, "other-secret")).toBe(false);
  });

  it("rejects a tampered payload", () => {
    const token = createSessionToken(SECRET);
    const [expires, , sig] = token.split(".");
    const forged = `${expires}.deadbeefdeadbeef.${sig}`;
    expect(verifySessionToken(forged, SECRET)).toBe(false);
  });

  it("rejects an expired token", () => {
    const past = Date.now() - SESSION_TTL_MS - 1000;
    const token = createSessionToken(SECRET, past);
    expect(verifySessionToken(token, SECRET)).toBe(false);
  });

  it("rejects empty / malformed tokens", () => {
    expect(verifySessionToken(undefined, SECRET)).toBe(false);
    expect(verifySessionToken("", SECRET)).toBe(false);
    expect(verifySessionToken("a.b", SECRET)).toBe(false);
  });

  it("matches the admin password in constant time, rejecting wrong/empty", () => {
    expect(constantTimePasswordMatch("hunter2", "hunter2")).toBe(true);
    expect(constantTimePasswordMatch("wrong", "hunter2")).toBe(false);
    expect(constantTimePasswordMatch("anything", "")).toBe(false);
  });
});
