import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL || 'https://talented-bluegill-18262.upstash.io',
  token: process.env.UPSTASH_REDIS_TOKEN || '',
});

// Rate limiter: 100 requests per minute per API key
export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix: 'nukopt:ratelimit',
});

// Check rate limit for an API key
export async function checkRateLimit(apiKey: string): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  try {
    const { success, limit, remaining, reset } = await ratelimit.limit(apiKey);
    return { success, limit, remaining, reset };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail open - allow request if Redis is down
    return { success: true, limit: 100, remaining: 99, reset: Date.now() + 60000 };
  }
}
