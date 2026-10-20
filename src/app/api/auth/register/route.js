import bcrypt from 'bcryptjs';
import { query, initDatabase, seedDefaultCategories } from '@/lib/db';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    await initDatabase();
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return Response.json({ error: 'Semua field harus diisi' }, { status: 400 });
    }

    // Check if user exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return Response.json({ error: 'Email sudah terdaftar' }, { status: 409 });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const result = await query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, password_hash]
    );
    const user = result.rows[0];

    // Seed default categories
    await seedDefaultCategories(user.id);

    // Create default wallet
    await query(
      'INSERT INTO wallets (user_id, name, type, balance, icon) VALUES ($1, $2, $3, $4, $5)',
      [user.id, 'Dompet Utama', 'checking', 0, '💳']
    );

    // Sign JWT
    const token = signToken({ id: user.id, name: user.name, email: user.email });
    
    const cookieStore = await cookies();
    cookieStore.set('arus_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return Response.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error('Register error:', error);
    return Response.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
