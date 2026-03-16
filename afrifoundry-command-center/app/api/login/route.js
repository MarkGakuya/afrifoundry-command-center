import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'afrifoundry-command-center-secret-2026'
);
const API_BASE = process.env.API_BASE || 'https://afrifoundry-api.onrender.com';

export async function POST(request) {
  const { email, password } = await request.json();

  // Local admin fallback (env-based)
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'mark@afrifoundry.com';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'afrifoundry2026';

  let role = null;
  let userId = null;

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    role = 'admin';
    userId = 'local-admin';
  } else {
    // Try AfriFoundry API auth
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        role = data.role || 'product';
        userId = data.user_id || data.id;
      }
    } catch {
      // API unreachable — only allow env-based admin
    }
  }

  if (!role) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = await new SignJWT({ role, userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);

  const response = NextResponse.json({ ok: true, role });
  response.cookies.set('cc_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 86400,
    path: '/',
  });

  return response;
}
