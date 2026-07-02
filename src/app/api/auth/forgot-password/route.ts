import { NextResponse } from "next/server";
import { assertCsrf } from "@/lib/csrf";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isEmail, jsonError } from "@/lib/validate";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import {
  generateResetToken,
  sendResetEmail,
  RESET_TTL_MS,
} from "@/lib/password-reset";

// 5 reset requests per IP per hour.
const RESET_LIMIT = 5;
const RESET_WINDOW = 60 * 60 * 1000;

export async function POST(req: Request) {
  const csrfError = assertCsrf(req); if (csrfError) return csrfError;
  // Rate limit by IP to curb abuse.
  const ip = getClientIp(Object.fromEntries(req.headers));
  const { ok, retryAfter } = rateLimit(`pwd-reset:${ip}`, RESET_LIMIT, RESET_WINDOW);
  if (!ok) {
    return NextResponse.json(
      { error: "请求过于频繁，请稍后再试" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  let email: unknown;
  try {
    const body = await req.json();
    email = body?.email;
  } catch {
    return jsonError("无效的请求体", 400);
  }
  if (!isEmail(email)) return jsonError("邮箱格式不正确", 422);

  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    // Invalidate any previously-issued (unused, unexpired) tokens for this
    // email so only the newest link works. Wrapped in a transaction with the
    // create so a failure between the two can't leave a stale valid token
    // alongside a brand-new one.
    const { raw, hash: tokenHash } = generateResetToken();
    await prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.updateMany({
        where: { email, usedAt: null },
        data: { usedAt: new Date() },
      });
      await tx.passwordResetToken.create({
        data: {
          email,
          token: tokenHash,
          expiresAt: new Date(Date.now() + RESET_TTL_MS),
        },
      });
    });

    const resetUrl = `${
      new URL(req.url).origin
    }/reset-password?token=${raw}`;

    await sendResetEmail(email, resetUrl);

    // In development, echo the link back so the flow is usable without an
    // email service. Production never leaks the link (anti-enumeration).
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({ ok: true, resetUrl });
    }
  } else {
    // Anti-enumeration: equalize timing with a dummy hash so the response
    // time doesn't reveal whether the email exists.
    await hash(rawTokenDummy(), 12);
  }

  return NextResponse.json({ ok: true });
}

// A constant dummy input for the timing-equalization hash. Its value is
// irrelevant; we only need the CPU cost of bcrypt to match the real path.
function rawTokenDummy(): string {
  return "00000000000000000000000000000000";
}
