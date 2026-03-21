import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname === '/login' || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('cc_token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
