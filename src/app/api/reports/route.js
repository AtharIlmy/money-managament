import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request) {
  const auth = await getAuthUser();
  if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  const dateCondition = startDate && endDate
    ? `AND t.date >= '${startDate}' AND t.date <= '${endDate}'`
    : `AND EXTRACT(MONTH FROM t.date) = EXTRACT(MONTH FROM CURRENT_DATE)
       AND EXTRACT(YEAR FROM t.date) = EXTRACT(YEAR FROM CURRENT_DATE)`;

  // Summary
  const summaryResult = await query(
    `SELECT 
       COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
       COUNT(*) as total_transactions
     FROM transactions WHERE user_id = $1 ${dateCondition.replace(/t\./g, '')}`,
    [auth.id]
  );

  // Monthly income vs expense (last 6 months)
  const monthlyResult = await query(
    `SELECT 
       TO_CHAR(date, 'Mon') as month_short,
       EXTRACT(MONTH FROM date) as month_num,
       EXTRACT(YEAR FROM date) as year,
       COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
     FROM transactions
     WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '6 months'
     GROUP BY month_short, month_num, year
     ORDER BY year, month_num`,
    [auth.id]
  );

  // Top spending categories
  const topCategoriesResult = await query(
    `SELECT c.name, c.icon, c.color,
       SUM(t.amount) as total,
       COUNT(t.id) as count
     FROM transactions t
     JOIN categories c ON t.category_id = c.id
     WHERE t.user_id = $1 AND t.type = 'expense' ${dateCondition}
     GROUP BY c.id, c.name, c.icon, c.color
     ORDER BY total DESC
     LIMIT 8`,
    [auth.id]
  );

  // Income sources
  const incomeSourcesResult = await query(
    `SELECT c.name, c.icon, c.color,
       SUM(t.amount) as total
     FROM transactions t
     JOIN categories c ON t.category_id = c.id
     WHERE t.user_id = $1 AND t.type = 'income' ${dateCondition}
     GROUP BY c.id, c.name, c.icon, c.color
     ORDER BY total DESC`,
    [auth.id]
  );

  // Wallet balances
  const walletsResult = await query(
    'SELECT name, balance, icon, color FROM wallets WHERE user_id = $1',
    [auth.id]
  );

  // Recent transactions for report
  const recentResult = await query(
    `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
       w.name as wallet_name
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     LEFT JOIN wallets w ON t.wallet_id = w.id
     WHERE t.user_id = $1 ${dateCondition}
     ORDER BY t.date DESC LIMIT 10`,
    [auth.id]
  );

  const summary = summaryResult.rows[0];

  return Response.json({
    summary: {
      total_income: parseFloat(summary.total_income),
      total_expense: parseFloat(summary.total_expense),
      net: parseFloat(summary.total_income) - parseFloat(summary.total_expense),
      total_transactions: parseInt(summary.total_transactions),
    },
    monthly: monthlyResult.rows,
    top_categories: topCategoriesResult.rows,
    income_sources: incomeSourcesResult.rows,
    wallets: walletsResult.rows,
    recent_transactions: recentResult.rows,
  });
}
