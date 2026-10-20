import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function DELETE(request, { params }) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await query('DELETE FROM budgets WHERE id = $1 AND user_id = $2', [id, auth.id]);
  return Response.json({ success: true });
}
