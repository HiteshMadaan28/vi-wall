import "server-only";
import { randomBytes } from "node:crypto";
import { SITE_NAME, SITE_URL } from "./config";

/**
 * Email verification.
 *
 * Uses Resend when RESEND_API_KEY + EMAIL_FROM are configured. When they are
 * not, sending is a no-op that reports `configured: false` — the caller then
 * leaves the claim in `pending_verification` and surfaces the verification
 * link in a clearly-labelled, non-production dev mode rather than pretending
 * an email was sent.
 */

export function generateVerificationToken(): string {
  return randomBytes(24).toString("hex");
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export function verificationUrl(token: string): string {
  return `${SITE_URL}/verify?token=${encodeURIComponent(token)}`;
}

export interface SendResult {
  configured: boolean;
  sent: boolean;
  error?: string;
}

export async function sendVerificationEmail(
  to: string,
  token: string
): Promise<SendResult> {
  if (!isEmailConfigured()) {
    return { configured: false, sent: false };
  }

  const link = verificationUrl(token);
  const html = `
    <div style="font-family:system-ui,sans-serif;background:#0b0614;color:#f5f3ff;padding:32px;border-radius:16px">
      <h1 style="color:#d946ef;margin:0 0 12px">${SITE_NAME}</h1>
      <p style="font-size:16px;line-height:1.5">Confirm your email to claim your tile on the VI Wall and put your country on the board.</p>
      <p style="margin:24px 0">
        <a href="${link}" style="background:linear-gradient(90deg,#d946ef,#6366f1);color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600">Verify &amp; claim my tile</a>
      </p>
      <p style="font-size:13px;color:#a78bfa">If the button doesn't work, paste this link into your browser:<br>${link}</p>
      <p style="font-size:12px;color:#6b5b95;margin-top:24px">You received this because someone used this address to claim a tile. If that wasn't you, ignore this email.</p>
    </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to,
        subject: `Verify your ${SITE_NAME} tile`,
        html,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { configured: true, sent: false, error: text.slice(0, 200) };
    }
    return { configured: true, sent: true };
  } catch (err) {
    return {
      configured: true,
      sent: false,
      error: err instanceof Error ? err.message : "send failed",
    };
  }
}
