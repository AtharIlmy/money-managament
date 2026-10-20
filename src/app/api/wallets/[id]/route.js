import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function PUT(request, { params }) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { name, type, balance, icon, color } = await request.json();

  const result = await query(
    `UPDATE wallets SET name = COALESCE($1, name), type = COALESCE($2, type), 
     balance = COALESCE($3, balance), icon = COALESCE($4, icon), color = COALESCE($5, color)
     WHERE id = $6 AND user_id = $7 RETURNING *`,
    [name, type, balance, icon, color, id, auth.id]
  );

  if (result.rows.length === 0) return Response.json({ error: 'Dompet tidak ditemukan' }, { status: 404 });
  return Response.json({ wallet: result.rows[0] });
}

export async function DELETE(request, { params }) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  await query('DELETE FROM wallets WHERE id = $1 AND user_id = $2', [id, auth.id]);
  return Response.json({ success: true });
}
