import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  const { pathname } = request.nextUrl;

  // লগইন না থাকলে সরাসরি /login পেজে পাঠাবে
  if (!token && !pathname.endsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // লগইন থাকলে পুনরায় /login পেজে ঢুকতে দেবে না
  if (token && pathname.endsWith('/login')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // (admin) ফোল্ডারের ভেতরে থাকা সব রাউট প্রটেক্ট করার জন্য
  matcher: ['/dashboard/:path*', '/tools/:path*', '/login'],
};