/**
 * In-memory rate limiter for API routes and Server Actions.
 *
 * Uses a simple sliding-window approach with per-IP buckets.
 * Not distributed — suitable for single-instance deployment.
 * For multi-instance, replace with Upstash / Redis-backed rate limiter.
 */

type Bucket = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Bucket>();

/** Clean up expired entries periodically. */
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = 0;

function cleanExpired(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, bucket] of store) {
    if (now > bucket.resetAt) store.delete(key);
  }
}

/**
 * Check if a request should be rate-limited.
 *
 * @param key     Identifier for the client (e.g. IP address).
 * @param limit   Maximum requests allowed in the window.
 * @param windowMs  Window duration in milliseconds.
 * @returns `true` if the request is allowed; `false` if rate-limited.
 */
export function checkRateLimit(
  key: string,
  limit = 20,
  windowMs = 60_000,
): boolean {
  const now = Date.now();
  cleanExpired(now);

  const bucket = store.get(key);

  if (!bucket || now > bucket.resetAt) {
    // Start a new window
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) {
    return false;
  }

  bucket.count += 1;
  return true;
}

/**
 * Get remaining requests in the current window.
 */
export function rateLimitRemaining(key: string, limit = 20): number {
  const bucket = store.get(key);
  if (!bucket || Date.now() > bucket.resetAt) return limit;
  return Math.max(0, limit - bucket.count);
}

/**
 * Get milliseconds until the rate-limit window resets.
 */
export function rateLimitReset(key: string, windowMs = 60_000): number {
  const bucket = store.get(key);
  if (!bucket) return 0;
  return Math.max(0, bucket.resetAt - Date.now());
}

/**
 * Extract a rate-limit key from a request.
 * Uses x-forwarded-for header (Vercel) or direct IP.
 */
export function getRateLimitKey(
  requestOrIp: Request | string,
): string {
  if (typeof requestOrIp === "string") return `ip:${requestOrIp}`;

  const forwarded = requestOrIp.headers.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0]?.trim() ?? "unknown"
    : "unknown";
  return `ip:${ip}`;
}
