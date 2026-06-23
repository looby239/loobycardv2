import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { checkAdminCredentials, signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!checkAdminCredentials(username, password)) {
      return NextResponse.json(
        { success: false, error: 'Tên đăng nhập hoặc mật khẩu không chính xác' },
        { status: 401 }
      );
    }

    // Sign token (valid for 24 hours)
    const expires = Date.now() + 24 * 60 * 60 * 1000;
    const token = await signToken({ username, expires });

    // Set secure HttpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi hệ thống khi đăng nhập' },
      { status: 500 }
    );
  }
}
