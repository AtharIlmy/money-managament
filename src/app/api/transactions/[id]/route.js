import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function DELETE(request, { params }) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  // Get transaction first to reverse balance
  const txResult = await query(
    'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
    [id, auth.id]
  );

  if (txResult.rows.length === 0) {
    return Response.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
  }

  const tx = txResult.rows[0];
  const balanceChange = tx.type === 'income' ? -tx.amount : tx.amount;

  // Reverse wallet balance
  await query(
    'UPDATE wallets SET balance = balance + $1 WHERE id = $2',
    [balanceChange, tx.wallet_id]
  );

  // Delete transaction
  await query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [id, auth.id]);

  return Response.json({ success: true });
}
