/** In-memory fixed-window rate limiter. Deliberately not distributed —
 * this app runs as a single persistent server (see docs/ARCHITECTURE.md),
 * so per-instance state is sufficient; it resets on restart/redeploy,
 * which is an acceptable tradeoff for slowing down brute-force login and
 * signup-spam attempts rather than requiring a shared store (Redis) for a
 * single-instance app. */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Opportunistic cleanup so `buckets` doesn't grow unbounded over long
// uptime from many distinct keys (emails/IPs).
function sweepExpired(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function rateLimit(key: string, max: number, windowMs: number): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  sweepExpired(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }
  if (bucket.count >= max) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }
  bucket.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

/** Best-effort client IP from proxy headers (Railway and most hosts set
 * x-forwarded-for). Falls back to a shared bucket when absent rather than
 * throwing — IP-based limiting is a defense-in-depth layer here, not the
 * only one (email-keyed limiting still applies per-account). */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}
