import { randomBytes, createHash } from "node:crypto";

/** How long a reset token remains valid after issuance. */
export const RESET_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Generate a URL-safe reset token and its DB-stored hash. Only the hash is
 * persisted, so a DB read doesn't grant access to live tokens (one-time,
 * short-lived). The raw token is returned to send to the user.
 */
export function generateResetToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("hex");
  const hash = hashToken(raw);
  return { raw, hash };
}

/** Hash a raw token for storage/lookup. Deterministic so lookup works. */
export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Deliver a reset link to the user.
 *
 * No email service is wired up in this project. The default behavior logs
 * the link to the server console so an operator of this single-instance
 * deployment can copy it. To send real email, replace this function body
 * with a call to your email provider (e.g. nodemailer / Resend / SES) and
 * remove the console output in production.
 */
export async function sendResetEmail(email: string, resetUrl: string): Promise<void> {
  console.log(`[password-reset] Reset link for ${email}: ${resetUrl}`);
}
