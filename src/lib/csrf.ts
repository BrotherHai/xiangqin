import { NextResponse } from "next/server";

/**
 * Reject cross-origin state-changing requests (CSRF defense).
 *
 * Browsers always send an `Origin` (or `Referer`) header on POST/PUT/DELETE
 * fetches. For a same-origin request the host portion matches the request's
 * `Host` header; a cross-origin form submission or script would carry a
 * foreign origin. We allow the request only when the origin matches, fall
 * back to `Referer` when `Origin` is absent, and reject when neither is
 * present or they mismatch.
 *
 * Read-only methods (GET/HEAD/OPTIONS) are unaffected — they are not
 * state-changing and next-auth's own endpoints validate their own CSRF tokens.
 */
export function assertCsrf(req: Request): NextResponse | null {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return null;
  }

  const host = req.headers.get("host");
  if (!host) {
    // No host header is itself suspicious for a browser request.
    return NextResponse.json({ error: "请求来源校验失败" }, { status: 403 });
  }

  const origin = req.headers.get("origin");
  if (origin) {
    if (sameHost(origin, host)) return null;
    return NextResponse.json({ error: "跨域请求被拒绝" }, { status: 403 });
  }

  const referer = req.headers.get("referer");
  if (referer) {
    if (sameHost(referer, host)) return null;
    return NextResponse.json({ error: "跨域请求被拒绝" }, { status: 403 });
  }

  // Neither Origin nor Referer present on a state-changing request — block.
  return NextResponse.json({ error: "请求来源校验失败" }, { status: 403 });
}

function sameHost(urlStr: string, host: string): boolean {
  try {
    const u = new URL(urlStr);
    // Compare host (and, if present, port). `host` header includes port.
    return u.host === host;
  } catch {
    return false;
  }
}
