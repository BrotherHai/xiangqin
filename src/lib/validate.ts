import { NextResponse } from "next/server";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export type Parsed<T> = { data: T; error: null } | { data: null; error: NextResponse };

export async function parseJson<T = Record<string, unknown>>(req: Request): Promise<Parsed<T>> {
  try {
    const data = (await req.json()) as T;
    return { data, error: null };
  } catch {
    return { data: null, error: jsonError("无效的请求体", 400) };
  }
}

export function parseAge(value: unknown): number | null {
  const n = typeof value === "number" ? value : parseInt(typeof value === "string" ? value : "", 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmail(value: unknown): value is string {
  return typeof value === "string" && EMAIL_RE.test(value);
}

/**
 * Validate password strength.
 * Requires: length >= 8, at least one letter, at least one digit.
 * Returns an error message if invalid, null if valid.
 */
export function validatePassword(value: unknown): string | null {
  if (typeof value !== "string" || value.length < 8) {
    return "密码至少 8 位";
  }
  if (!/[a-zA-Z]/.test(value)) {
    return "密码需至少包含一个字母";
  }
  if (!/\d/.test(value)) {
    return "密码需至少包含一个数字";
  }
  return null;
}
