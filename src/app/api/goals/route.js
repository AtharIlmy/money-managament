import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const result = await query('SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC', [auth.id]);
  return Response.json({ goals: result.rows });
}

export async function POST(request) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { name, target_amount, current_amount, deadline, icon, color } = await request.json();
  if (!name || !target_amount) return Response.json({ error: 'Data tidak lengkap' }, { status: 400 });
  const result = await query(
    `INSERT INTO goals (user_id, name, target_amount, current_amount, deadline, icon, color) 
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [auth.id, name, target_amount, current_amount || 0, deadline, icon || '🎯', color || '#1B4332']
  );
  return Response.json({ goal: result.rows[0] }, { status: 201 });
}
