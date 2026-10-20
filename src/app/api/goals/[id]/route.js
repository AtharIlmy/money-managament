import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function PUT(request, { params }) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const { current_amount } = await request.json();
  const result = await query(
    'UPDATE goals SET current_amount = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
    [current_amount, id, auth.id]
  );
  return Response.json({ goal: result.rows[0] });
}

export async function DELETE(request, { params }) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await query('DELETE FROM goals WHERE id = $1 AND user_id = $2', [id, auth.id]);
  return Response.json({ success: true });
}
