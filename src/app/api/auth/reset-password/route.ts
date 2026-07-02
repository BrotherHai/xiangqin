import { NextResponse } from "next/server";
import { assertCsrf } from "@/lib/csrf";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { jsonError, parseJson, asString, validatePassword } from "@/lib/validate";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { hashToken } from "@/lib/password-reset";

// 10 reset submissions per IP per 10 minutes.
const RESET_LIMIT = 10;
const RESET_WINDOW = 10 * 60 * 1000;

export async function POST(req: Request) {
  const csrfError = assertCsrf(req); if (csrfError) return csrfError;
  const ip = getClientIp(Object.fromEntries(req.headers));
  const { ok, retryAfter } = rateLimit(`pwd-reset-submit:${ip}`, RESET_LIMIT, RESET_WINDOW);
  if (!ok) {
    return NextResponse.json(
      { error: "请求过于频繁，请稍后再试" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  const { data: body, error: parseError } = await parseJson(req);
  if (parseError) return parseError;

  const token = asString(body.token);
  const password = body.password;
  if (!token) return jsonError("缺少重置凭证", 422);
  if (typeof password !== "string") return jsonError("请输入密码", 422);
  const pwError = validatePassword(password);
  if (pwError) return jsonError(pwError, 422);

  const tokenHash = hashToken(token);
  const record = await prisma.passwordResetToken.findUnique({
    where: { token: tokenHash },
  });

  // Generic "invalid or expired" for all failure modes (not found, used,
  // expired) so we don't reveal token state to an attacker.
  if (!record || record.usedAt || record.expiresAt <= new Date()) {
    return jsonError("重置链接无效或已过期，请重新申请", 410);
  }

  const hashed = await hash(password, 12);

  // Atomically consume the token and update the password. If two requests
  // race on the same token, the unique constraint + usedAt check prevents
  // double-use; the transaction keeps the two writes consistent.
  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { email: record.email },
        data: { password: hashed },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);
  } catch {
    return jsonError("重置失败，请稍后重试", 500);
  }

  return NextResponse.json({ ok: true });
}
