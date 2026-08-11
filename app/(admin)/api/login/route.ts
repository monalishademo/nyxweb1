import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    const ENV_USER = process.env.ADMIN_USER || 'NYX ADMIN';
    const ENV_PASS = process.env.ADMIN_PASS || 'NYXWEB1';

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