import express from 'express';
import { query } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/summary', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const hasMonthParam = req.query.month !== undefined && req.query.month !== '' && req.query.month !== 'null';
    const selectedMonth = hasMonthParam ? parseInt(req.query.month, 10) : (now.getMonth() + 1);
    const selectedYear = req.query.year ? parseInt(req.query.year, 10) : now.getFullYear();

    // 1. Total balance across all wallets
    const balanceRes = await query(
      `SELECT COALESCE(SUM(balance), 0) as total_balance FROM wallets WHERE user_id = $1`,
      [userId]
    );
    const totalBalance = parseFloat(balanceRes.rows[0]?.total_balance || 0);

    // 2. Income & expense + expense transaction counts
    let monthlyRes;
    if (hasMonthParam) {
      monthlyRes = await query(
        `SELECT 
           COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as monthly_income,
           COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as monthly_expense,
           COALESCE(COUNT(CASE WHEN type = 'expense' THEN 1 END), 0) as expense_tx_count
         FROM transactions
         WHERE user_id = $1 
           AND EXTRACT(MONTH FROM date) = $2 
           AND EXTRACT(YEAR FROM date) = $3`,
        [userId, selectedMonth, selectedYear]
      );
    } else {
      // Whole year summary
      monthlyRes = await query(
        `SELECT 
           COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as monthly_income,
           COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as monthly_expense,
           COALESCE(COUNT(CASE WHEN type = 'expense' THEN 1 END), 0) as expense_tx_count
         FROM transactions
         WHERE user_id = $1 
           AND EXTRACT(YEAR FROM date) = $2`,
        [userId, selectedYear]
      );
    }
    const monthlyIncome = parseFloat(monthlyRes.rows[0]?.monthly_income || 0);
    const monthlyExpense = parseFloat(monthlyRes.rows[0]?.monthly_expense || 0);
    const expenseTxCount = parseInt(monthlyRes.rows[0]?.expense_tx_count || 0, 10);

    // Days elapsed calculation
    let daysElapsed = 1;
    if (hasMonthParam) {
      if (selectedMonth === (now.getMonth() + 1) && selectedYear === now.getFullYear()) {
        daysElapsed = Math.max(1, now.getDate());
      } else {
        daysElapsed = new Date(selectedYear, selectedMonth, 0).getDate();
      }
    } else {
      daysElapsed = 365;
    }
    const dailyAvgExpense = Math.round(monthlyExpense / daysElapsed);
    const avgPerTransaction = expenseTxCount > 0 ? Math.round(monthlyExpense / expenseTxCount) : 0;

    // 3. Total savings / budget target
    const goalsRes = await query(
      `SELECT COALESCE(SUM(current_amount), 0) as total_savings, COALESCE(SUM(target_amount), 0) as target_savings 
       FROM goals WHERE user_id = $1`,
      [userId]
    );
    const totalSavings = parseFloat(goalsRes.rows[0]?.total_savings || 0);

    // 4. Monthly trend (last 6 months)
    const trendRes = await query(
      `SELECT 
         TO_CHAR(date, 'Mon') as month_label,
         EXTRACT(MONTH FROM date) as month_num,
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
       FROM transactions
       WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '6 months'
       GROUP BY TO_CHAR(date, 'Mon'), EXTRACT(MONTH FROM date)
       ORDER BY month_num ASC`,
      [userId]
    );

    // Default months if empty
    let trendData = trendRes.rows.map((r) => ({
      name: r.month_label,
      Pemasukan: parseFloat(r.income),
      Pengeluaran: parseFloat(r.expense),
    }));

    if (trendData.length === 0) {
      const months = ['Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt'];
      trendData = months.map((m) => ({
        name: m,
        Pemasukan: 0,
        Pengeluaran: 0,
      }));
    }

    // 5. Recent transactions
    const recentRes = await query(
      `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color, w.name as wallet_name
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN wallets w ON t.wallet_id = w.id
       WHERE t.user_id = $1
       ORDER BY t.date DESC, t.created_at DESC
       LIMIT 6`,
      [userId]
    );

    // 6. Category budgets status for summary
    const budgetRes = await query(
      `SELECT b.*, c.name as category_name, c.icon as category_icon,
         COALESCE((
           SELECT SUM(t.amount) 
           FROM transactions t 
           WHERE t.category_id = b.category_id 
             AND t.user_id = b.user_id
             AND t.date BETWEEN b.start_date AND b.end_date
         ), 0) as spent
       FROM budgets b
       JOIN categories c ON b.category_id = c.id
       WHERE b.user_id = $1
       LIMIT 4`,
      [userId]
    );

    // 7. Top Expense Categories & Top Transaction
    let topCatRes;
    let topTxRes;
    if (hasMonthParam) {
      topCatRes = await query(
        `SELECT c.id, c.name, c.icon, c.color, 
                COALESCE(SUM(t.amount), 0) as total_amount, 
                COUNT(t.id) as count
         FROM transactions t
         JOIN categories c ON t.category_id = c.id
         WHERE t.user_id = $1 AND t.type = 'expense'
           AND EXTRACT(MONTH FROM t.date) = $2 AND EXTRACT(YEAR FROM t.date) = $3
         GROUP BY c.id, c.name, c.icon, c.color
         ORDER BY total_amount DESC
         LIMIT 5`,
        [userId, selectedMonth, selectedYear]
      );
      topTxRes = await query(
        `SELECT t.id, t.description, t.amount, t.date, 
                c.name as category_name, c.icon as category_icon, c.color as category_color
         FROM transactions t
         LEFT JOIN categories c ON t.category_id = c.id
         WHERE t.user_id = $1 AND t.type = 'expense'
           AND EXTRACT(MONTH FROM t.date) = $2 AND EXTRACT(YEAR FROM t.date) = $3
         ORDER BY t.amount DESC
         LIMIT 1`,
        [userId, selectedMonth, selectedYear]
      );
    } else {
      topCatRes = await query(
        `SELECT c.id, c.name, c.icon, c.color, 
                COALESCE(SUM(t.amount), 0) as total_amount, 
                COUNT(t.id) as count
         FROM transactions t
         JOIN categories c ON t.category_id = c.id
         WHERE t.user_id = $1 AND t.type = 'expense'
           AND EXTRACT(YEAR FROM t.date) = $2
         GROUP BY c.id, c.name, c.icon, c.color
         ORDER BY total_amount DESC
         LIMIT 5`,
        [userId, selectedYear]
      );
      topTxRes = await query(
        `SELECT t.id, t.description, t.amount, t.date, 
                c.name as category_name, c.icon as category_icon, c.color as category_color
         FROM transactions t
         LEFT JOIN categories c ON t.category_id = c.id
         WHERE t.user_id = $1 AND t.type = 'expense'
           AND EXTRACT(YEAR FROM t.date) = $2
         ORDER BY t.amount DESC
         LIMIT 1`,
        [userId, selectedYear]
      );
    }

    const topExpenseCategories = (topCatRes.rows || []).map((cat) => ({
      ...cat,
      total_amount: parseFloat(cat.total_amount),
      percentage: monthlyExpense > 0 ? ((parseFloat(cat.total_amount) / monthlyExpense) * 100).toFixed(1) : '0',
    }));

    const topExpenseCategory = topExpenseCategories.length > 0 ? topExpenseCategories[0] : null;
    const topExpenseTransaction = topTxRes.rows[0] ? {
      ...topTxRes.rows[0],
      amount: parseFloat(topTxRes.rows[0].amount),
    } : null;

    res.json({
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      totalSavings,
      dailyAvgExpense,
      avgPerTransaction,
      expenseTxCount,
      daysElapsed,
      topExpenseCategory,
      topExpenseCategories,
      topExpenseTransaction,
      trendData,
      recentTransactions: recentRes.rows,
      budgets: budgetRes.rows,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Gagal memuat data dashboard' });
  }
});

export default router;
