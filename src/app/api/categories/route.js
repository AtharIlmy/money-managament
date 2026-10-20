import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await query(
    'SELECT * FROM categories WHERE user_id = $1 ORDER BY type, name',
    [auth.id]
  );

  return Response.json({ categories: result.rows });
}

export async function POST(request) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, type, icon, color } = await request.json();

  if (!name || !type) {
    return Response.json({ error: 'Nama dan tipe kategori harus diisi' }, { status: 400 });
  }

  const result = await query(
    'INSERT INTO categories (user_id, name, type, icon, color) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [auth.id, name, type, icon || '📌', color || '#84A98C']
  );

  return Response.json({ category: result.rows[0] }, { status: 201 });
}
