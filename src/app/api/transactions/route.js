import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const type = searchParams.get('type');
  const walletId = searchParams.get('wallet_id');
  const categoryId = searchParams.get('category_id');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  let conditions = ['t.user_id = $1'];
  let paramValues = [auth.id];
  let paramIndex = 2;

  if (type) {
    conditions.push(`t.type = $${paramIndex++}`);
    paramValues.push(type);
  }
  if (walletId) {
    conditions.push(`t.wallet_id = $${paramIndex++}`);
    paramValues.push(walletId);
  }
  if (categoryId) {
    conditions.push(`t.category_id = $${paramIndex++}`);
    paramValues.push(categoryId);
  }
  if (startDate) {
    conditions.push(`t.date >= $${paramIndex++}`);
    paramValues.push(startDate);
  }
  if (endDate) {
    conditions.push(`t.date <= $${paramIndex++}`);
    paramValues.push(endDate);
  }

  const whereClause = conditions.join(' AND ');

  const result = await query(
    `SELECT t.*, 
       c.name as category_name, c.icon as category_icon, c.color as category_color,
       w.name as wallet_name, w.icon as wallet_icon
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     LEFT JOIN wallets w ON t.wallet_id = w.id
     WHERE ${whereClause}
     ORDER BY t.date DESC, t.created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...paramValues, limit, offset]
  );

  const countResult = await query(
    `SELECT COUNT(*) FROM transactions t WHERE ${whereClause}`,
    paramValues
  );

  return Response.json({
    transactions: result.rows,
    total: parseInt(countResult.rows[0].count),
  });
}

export async function POST(request) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { wallet_id, category_id, amount, type, description, date } = await request.json();

  if (!wallet_id || !amount || !type) {
    return Response.json({ error: 'Data tidak lengkap' }, { status: 400 });
  }

  // Start transaction
  const client = await query('BEGIN');
  
  try {
    // Insert transaction
    const result = await query(
      `INSERT INTO transactions (user_id, wallet_id, category_id, amount, type, description, date)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [auth.id, wallet_id, category_id, amount, type, description, date || new Date().toISOString().split('T')[0]]
    );

    // Update wallet balance
    const balanceChange = type === 'income' ? amount : -amount;
    await query(
      'UPDATE wallets SET balance = balance + $1 WHERE id = $2 AND user_id = $3',
      [balanceChange, wallet_id, auth.id]
    );

    await query('COMMIT');
    return Response.json({ transaction: result.rows[0] }, { status: 201 });
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
}
