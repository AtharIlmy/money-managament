import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await query(
    'SELECT * FROM wallets WHERE user_id = $1 ORDER BY created_at ASC',
    [auth.id]
  );

  // Calculate total balance
  const total = result.rows.reduce((sum, w) => sum + parseFloat(w.balance), 0);

  return Response.json({ wallets: result.rows, total });
}

export async function POST(request) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, type, balance, icon, color } = await request.json();

  if (!name) return Response.json({ error: 'Nama dompet harus diisi' }, { status: 400 });

  const result = await query(
    'INSERT INTO wallets (user_id, name, type, balance, icon, color) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [auth.id, name, type || 'checking', balance || 0, icon || '💳', color || '#1B4332']
  );

  return Response.json({ wallet: result.rows[0] }, { status: 201 });
}
