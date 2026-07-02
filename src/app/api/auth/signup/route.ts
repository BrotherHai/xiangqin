import { NextResponse } from "next/server";
import { assertCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { isEmail, jsonError, validatePassword } from "@/lib/validate";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// 5 signups per IP per hour.
const SIGNUP_LIMIT = 5;
const SIGNUP_WINDOW = 60 * 60 * 1000;

export async function POST(req: Request) {
  const csrfError = assertCsrf(req); if (csrfError) return csrfError;
  // Rate limit by IP to curb account-creation spam.
  const ip = getClientIp(Object.fromEntries(req.headers));
  const { ok, retryAfter } = rateLimit(`signup:${ip}`, SIGNUP_LIMIT, SIGNUP_WINDOW);
  if (!ok) {
    return NextResponse.json(
      { error: "注册过于频繁，请稍后再试" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  try {
    const { name, email, password, phone } = await req.json();

    if (typeof name !== "string" || !name.trim()) {
      return jsonError("请填写姓名", 422);
    }
    if (!isEmail(email)) {
      return jsonError("邮箱格式不正确", 422);
    }
    const pwError = validatePassword(password);
    if (pwError) return jsonError(pwError, 422);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      // Anti-enumeration: equalize timing with a dummy hash, then return the
      // same success shape as a real registration. The client redirects to
      // login either way, so an attacker can't distinguish new vs. existing.
      await hash(password, 12);
      return NextResponse.json({ ok: true });
    }

    const hashed = await hash(password, 12);
    await prisma.user.create({
      data: {
        name: name.trim(),
        email,
        password: hashed,
        phone: typeof phone === "string" && phone.trim() ? phone.trim() : null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json(
      { error: "注册失败" + (err instanceof Error ? ": " + err.message : "") },
      { status: 500 },
    );
  }
}
