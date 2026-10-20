import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await query('SELECT id, name, email, avatar, created_at FROM users WHERE id = $1', [auth.id]);
  if (result.rows.length === 0) return Response.json({ error: 'User not found' }, { status: 404 });

  return Response.json({ user: result.rows[0] });
}
