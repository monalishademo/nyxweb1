import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    const ENV_USER = process.env.ADMIN_USER;
    const ENV_PASS = process.env.ADMIN_PASS;

    // যদি এনভায়রনমেন্ট ভ্যারিয়েবল সেট করা না থাকে, তবে সিকিউরিটির জন্য লগইন ব্লক করে দেবে
    if (!ENV_USER || !ENV_PASS) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const isUserValid = username?.trim().toLowerCase() === ENV_USER.trim().toLowerCase();
    const isPassValid = password?.trim() === ENV_PASS.trim();

    if (isUserValid && isPassValid) {
      const response = NextResponse.json({ success: true });

      response.cookies.set('admin_token', 'authenticated_nyx_admin', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 1 Day
        path: '/',
      });

      return response;
    }

    return NextResponse.json({ error: 'Invalid Credentials' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}