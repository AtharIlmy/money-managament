import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';
import DashboardClient from './DashboardClient';

export const metadata = {
  title: 'Dasbor - Arus',
};

async function getDashboardData(userId) {
  try {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const [summary, balance, monthly, recent, categories] = await Promise.all([
      query(
        `SELECT 
          COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END),0) as income,
          COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END),0) as expense
        FROM transactions WHERE user_id=$1 AND date>=$2 AND date<=$3`,
        [userId, startDate, endDate]
      ),
      query('SELECT COALESCE(SUM(balance),0) as total FROM wallets WHERE user_id=$1', [userId]),
      query(
        `SELECT TO_CHAR(date,'Mon') as label, EXTRACT(MONTH FROM date) as m, EXTRACT(YEAR FROM date) as y,
          COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END),0) as income,
          COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END),0) as expense
        FROM transactions WHERE user_id=$1 AND date >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY label,m,y ORDER BY y,m`,
        [userId]
      ),
      query(
        `SELECT t.*, c.name as cat_name, c.icon as cat_icon, c.color as cat_color, w.name as wallet_name
        FROM transactions t
        LEFT JOIN categories c ON t.category_id=c.id
        LEFT JOIN wallets w ON t.wallet_id=w.id
        WHERE t.user_id=$1 ORDER BY t.date DESC, t.created_at DESC LIMIT 6`,
        [userId]
      ),
      query(
        `SELECT c.name,c.icon,c.color,c.type,COALESCE(SUM(t.amount),0) as total
        FROM categories c
        LEFT JOIN transactions t ON t.category_id=c.id AND t.user_id=$1 AND t.date>=$2 AND t.date<=$3
        WHERE c.user_id=$1 AND c.type='expense'
        GROUP BY c.id,c.name,c.icon,c.color,c.type ORDER BY total DESC LIMIT 5`,
        [userId, startDate, endDate]
      ),
    ]);

    return {
      income: parseFloat(summary.rows[0]?.income || 0),
      expense: parseFloat(summary.rows[0]?.expense || 0),
      balance: parseFloat(balance.rows[0]?.total || 0),
      monthly: monthly.rows,
      recent: recent.rows,
      categories: categories.rows,
      month: new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(now),
    };
  } catch (e) {
    console.error('Dashboard data error:', e);
    return { income: 0, expense: 0, balance: 0, monthly: [], recent: [], categories: [], month: '' };
  }
}

export default async function DasborPage() {
  const auth = await getAuthUser();
  const data = await getDashboardData(auth.id);
  const userResult = await query('SELECT name FROM users WHERE id=$1', [auth.id]).catch(() => ({ rows: [{ name: auth.name }] }));
  const userName = userResult.rows[0]?.name || auth.name;

  return <DashboardClient data={data} userName={userName} />;
}
