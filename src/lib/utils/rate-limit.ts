/**
 * Simple in-memory rate limiter using sliding window algorithm
 * For production at scale, consider using Upstash Redis
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap.entries()) {
    if (entry.resetAt < now) {
      rateLimitMap.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number
  /** Window size in seconds */
  windowSeconds: number
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (e.g., user ID, IP address)
 * @param config - Rate limit configuration
 * @returns Object with success status and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const windowMs = config.windowSeconds * 1000
  const key = identifier

  const entry = rateLimitMap.get(key)

  // No existing entry or window expired
  if (!entry || entry.resetAt < now) {
    const resetAt = now + windowMs
    rateLimitMap.set(key, { count: 1, resetAt })
    return {
      success: true,
      remaining: config.limit - 1,
      resetAt,
    }
  }

  // Window still active
  if (entry.count >= config.limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
    }
  }

  // Increment count
  entry.count++
  return {
    success: true,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Create a rate limiter with preset configuration
 */
export function createRateLimiter(config: RateLimitConfig) {
  return (identifier: string) => checkRateLimit(identifier, config)
}

// Preset rate limiters for common use cases
export const rateLimiters = {
  // 5 analyses per minute per user
  analyze: createRateLimiter({ limit: 5, windowSeconds: 60 }),

  // 10 API key tests per minute per user
  apiKeyTest: createRateLimiter({ limit: 10, windowSeconds: 60 }),

  // 20 checkout sessions per hour per user
  checkout: createRateLimiter({ limit: 20, windowSeconds: 3600 }),

  // 100 general API calls per minute per user
  general: createRateLimiter({ limit: 100, windowSeconds: 60 }),
}
