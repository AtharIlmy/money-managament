import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // Get budgets with spent amounts
  const result = await query(
    `SELECT b.*, 
       c.name as category_name, c.icon as category_icon, c.color as category_color,
       COALESCE(SUM(t.amount), 0) as spent
     FROM budgets b
     LEFT JOIN categories c ON b.category_id = c.id
     LEFT JOIN transactions t ON t.category_id = b.category_id 
       AND t.user_id = b.user_id
       AND t.type = 'expense'
       AND t.date >= b.start_date
       AND t.date <= b.end_date
     WHERE b.user_id = $1
     GROUP BY b.id, c.name, c.icon, c.color
     ORDER BY b.created_at DESC`,
    [auth.id]
  );

  // Get goals
  const goalsResult = await query(
    'SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC',
    [auth.id]
  );

  return Response.json({ budgets: result.rows, goals: goalsResult.rows });
}

export async function POST(request) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { category_id, amount, period, start_date, end_date } = await request.json();

  if (!category_id || !amount || !start_date || !end_date) {
    return Response.json({ error: 'Data tidak lengkap' }, { status: 400 });
  }

  const result = await query(
    `INSERT INTO budgets (user_id, category_id, amount, period, start_date, end_date)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [auth.id, category_id, amount, period || 'monthly', start_date, end_date]
  );

  return Response.json({ budget: result.rows[0] }, { status: 201 });
}
