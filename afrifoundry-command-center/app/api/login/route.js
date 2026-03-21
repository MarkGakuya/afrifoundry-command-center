import { NextResponse } from 'next/server';

const API_BASE       = process.env.API_BASE       || 'https://afrifoundry-api.onrender.com';
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'mark@afrifoundry.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AfriFoundry2026!';

export async function POST(request) {
  const { email, password } = await request.json();

  let role   = null;
  let authed = false;

  // 1. Env-based admin check (always works, no API dependency)
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    role   = 'admin';
    authed = true;
  } else {
    // 2. Try backend API
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        role   = data.role || 'user';
        authed = true;
      }
    } catch {
      // API unreachable — env-based admin only
    }
  }

  if (!authed) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const sessionToken = Buffer.from(`${email}:${role}:${Date.now()}`).toString('base64');

  const response = NextResponse.json({ ok: true, role });
  response.cookies.set('cc_token', sessionToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   86400 * 7,
    path:     '/',
  });

  return response;
}
