import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'afrifoundry-command-center-secret-2026'
);

const PUBLIC_ROUTES = ['/login'];

const ROLE_ROUTES = {
  admin: ['/bridge', '/intelligence', '/product', '/scouts', '/company', '/users'],
  data: ['/intelligence'],
  scout: ['/scouts'],
  product: ['/product'],
};

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow public routes and API routes
  if (PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('cc_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role;

    // Admin sees everything
    if (role === 'admin') return NextResponse.next();

    // Check role-based access
    const allowedRoutes = ROLE_ROUTES[role] || [];
    const isAllowed = allowedRoutes.some((route) => pathname.startsWith(route));

    if (!isAllowed) {
      const defaultRoute = allowedRoutes[0] || '/login';
      return NextResponse.redirect(new URL(defaultRoute, request.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
