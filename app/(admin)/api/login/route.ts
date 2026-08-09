import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const envUser = process.env.ADMIN_USER || 'NYX ADMIN';
    const envPass = process.env.ADMIN_PASS || 'NYXWEB1';

    if (username === envUser && password === envPass) {
      const response = NextResponse.json({ success: true, message: 'Login successful' });
      
      // ২৪ ঘণ্টার জন্য সিকিউর সেশন কুকি সেট
      response.cookies.set('admin_session', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24
      });

      return response;
    }

    return NextResponse.json(
      { success: false, message: 'Invalid Password' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}