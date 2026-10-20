import bcrypt from 'bcryptjs';
import { query, initDatabase } from '@/lib/db';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    await initDatabase();
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: 'Email dan password harus diisi' }, { status: 400 });
    }

    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return Response.json({ error: 'Email atau password salah' }, { status: 401 });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return Response.json({ error: 'Email atau password salah' }, { status: 401 });
    }

    const token = signToken({ id: user.id, name: user.name, email: user.email });

    const cookieStore = await cookies();
    cookieStore.set('arus_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return Response.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error('Login error:', error);
    return Response.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
