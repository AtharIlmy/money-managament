import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  const dateCondition = startDate && endDate
    ? `AND date >= '${startDate}' AND date <= '${endDate}'`
    : `AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
       AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)`;

  // Summary totals
  const summaryResult = await query(
    `SELECT 
       COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense
     FROM transactions 
     WHERE user_id = $1 ${dateCondition}`,
    [auth.id]
  );

  // Total balance from wallets
  const balanceResult = await query(
    'SELECT COALESCE(SUM(balance), 0) as total_balance FROM wallets WHERE user_id = $1',
    [auth.id]
  );

  // Category breakdown for expenses
  const categoryResult = await query(
    `SELECT c.name, c.icon, c.color, c.type,
       COALESCE(SUM(t.amount), 0) as total
     FROM categories c
     LEFT JOIN transactions t ON t.category_id = c.id AND t.user_id = $1 ${dateCondition}
     WHERE c.user_id = $1
     GROUP BY c.id, c.name, c.icon, c.color, c.type
     ORDER BY total DESC`,
    [auth.id]
  );

  // Monthly chart data (last 6 months)
  const monthlyResult = await query(
    `SELECT 
       EXTRACT(MONTH FROM date) as month,
       EXTRACT(YEAR FROM date) as year,
       COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
     FROM transactions
     WHERE user_id = $1 
       AND date >= CURRENT_DATE - INTERVAL '6 months'
     GROUP BY year, month
     ORDER BY year, month`,
    [auth.id]
  );

  // Recent transactions
  const recentResult = await query(
    `SELECT t.*, 
       c.name as category_name, c.icon as category_icon, c.color as category_color,
       w.name as wallet_name
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     LEFT JOIN wallets w ON t.wallet_id = w.id
     WHERE t.user_id = $1
     ORDER BY t.date DESC, t.created_at DESC
     LIMIT 5`,
    [auth.id]
  );

  const summary = summaryResult.rows[0];
  const balance = balanceResult.rows[0];

  return Response.json({
    total_balance: parseFloat(balance.total_balance),
    total_income: parseFloat(summary.total_income),
    total_expense: parseFloat(summary.total_expense),
    net: parseFloat(summary.total_income) - parseFloat(summary.total_expense),
    categories: categoryResult.rows,
    monthly: monthlyResult.rows,
    recent_transactions: recentResult.rows,
  });
}
