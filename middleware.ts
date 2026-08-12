import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  const { pathname } = request.nextUrl;

  const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/tools');

  // ১. লগইন না থাকলে /login-এ রিডাইরেক্ট করবে
  if (!token && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ২. লগইন করা থাকলে /login পেজে ঢুকতে দেবে না
  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/tools',
    '/tools/:path*',
    '/login'
  ],
};