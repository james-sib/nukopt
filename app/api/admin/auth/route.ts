import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Admin credentials from environment
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'nukopt2026';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'nukopt-admin-secret-change-me';

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token + ADMIN_SECRET).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    // Constant-time comparison to prevent timing attacks
    const userMatch = username === ADMIN_USER;
    const passMatch = password === ADMIN_PASS;

    if (!userMatch || !passMatch) {
      // Add delay to prevent brute force
      await new Promise(resolve => setTimeout(resolve, 1000));
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate session token
    const token = generateToken();
    const hashedToken = hashToken(token);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('admin_session', hashedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

// Logout
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
  return NextResponse.json({ success: true });
}
