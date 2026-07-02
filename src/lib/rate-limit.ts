/**
 * Simple in-memory fixed-window rate limiter.
 *
 * NOTE: in-memory only — suitable for single-process deployments
 * (this app uses SQLite on a single instance). For multi-instance /
 * serverless deployments, replace with a Redis- or DB-backed limiter.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

const SWEEP_INTERVAL = 60_000;

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();

  // Periodically purge expired buckets to avoid unbounded growth.
  if (now - lastSweep > SWEEP_INTERVAL) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
    lastSweep = now;
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true, remaining: limit - bucket.count, retryAfter: 0 };
}

/** Extract the client IP from request headers (best-effort). */
export function getClientIp(
  headers: Record<string, string | string[] | undefined>,
): string {
  const fwd = headers["x-forwarded-for"];
  const val = Array.isArray(fwd) ? fwd[0] : fwd;
  if (val) return val.split(",")[0].trim();
  const real = headers["x-real-ip"];
  const realVal = Array.isArray(real) ? real[0] : real;
  return realVal || "unknown";
}
