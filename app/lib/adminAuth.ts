import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'nukopt-admin-secret-change-me';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token + ADMIN_SECRET).digest('hex');
}

/**
 * Verify admin session from cookie
 * Returns true if valid admin session, false otherwise
 */
export async function verifyAdminSession(req: NextRequest): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session');
    
    if (!sessionCookie?.value) {
      return false;
    }
    
    // For now, just check if the cookie exists and is a valid hash format
    // In production, you'd want to store sessions in a database
    const hash = sessionCookie.value;
    
    // Basic validation: should be a 64-char hex string (SHA-256)
    if (!/^[a-f0-9]{64}$/i.test(hash)) {
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Admin auth error:', err);
    return false;
  }
}
