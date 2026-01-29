import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

/**
 * Constant-time authentication utilities
 * Fixes timing leak vulnerability where valid tokens took longer than invalid tokens
 */

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

// Minimum response time for auth operations (ms)
// Set higher than typical DB lookup time to normalize all responses
const MIN_AUTH_TIME_MS = 300;

/**
 * Slow pad operation to normalize timing
 * Uses PBKDF2 to consume CPU time consistently
 */
async function slowPad(targetMs: number = 50): Promise<void> {
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    // Use PBKDF2 for consistent CPU work
    crypto.pbkdf2('timing-pad', 'salt', 10000, 32, 'sha256', () => {
      const elapsed = Date.now() - startTime;
      const remaining = targetMs - elapsed;
      
      if (remaining > 0) {
        setTimeout(resolve, remaining);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Constant-time string comparison
 * Pads strings to equal length before comparison
 */
function constantTimeCompare(a: string, b: string): boolean {
  const maxLen = Math.max(a.length, b.length, 64);
  const bufA = Buffer.from(a.padEnd(maxLen, '\0'), 'utf8');
  const bufB = Buffer.from(b.padEnd(maxLen, '\0'), 'utf8');
  
  try {
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export interface AuthResult {
  valid: boolean;
  accountId?: string;
}

/**
 * Authenticate API key with constant-time response
 * Prevents timing attacks that could enumerate valid tokens
 */
export async function authenticateApiKey(authHeader: string | null): Promise<AuthResult> {
  const startTime = Date.now();
  
  let result: AuthResult = { valid: false };
  
  try {
    // Check header format
    if (!authHeader?.startsWith('Bearer nk-')) {
      // Invalid format - still do slow pad
      await slowPad(50);
      return result;
    }
    
    const apiKey = authHeader.slice(7); // Remove "Bearer "
    
    // Always perform DB lookup (even if we know it will fail)
    // This normalizes timing for all requests with valid format
    const supabase = getSupabase();
    const { data } = await supabase
      .from('nukopt_accounts')
      .select('id, api_key')
      .eq('api_key', apiKey)
      .single();
    
    if (data) {
      // Use constant-time comparison even though DB already matched
      // This prevents any timing leak from the comparison itself
      if (constantTimeCompare(apiKey, data.api_key)) {
        result = { valid: true, accountId: data.id };
      }
    }
  } catch (err) {
    // Log but don't leak error details
    console.error('Auth error:', err);
  }
  
  // Ensure minimum response time
  const elapsed = Date.now() - startTime;
  const remaining = MIN_AUTH_TIME_MS - elapsed;
  if (remaining > 0) {
    await new Promise(resolve => setTimeout(resolve, remaining));
  }
  
  return result;
}

/**
 * Add random jitter to response time (optional additional protection)
 */
export async function addTimingJitter(maxMs: number = 50): Promise<void> {
  const jitter = Math.random() * maxMs;
  await new Promise(resolve => setTimeout(resolve, jitter));
}
