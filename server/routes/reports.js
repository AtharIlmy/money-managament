import express from 'express';
import { query } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;

    const targetYear = parseInt(year) || new Date().getFullYear();
    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;

    // 1. Total income, expense, and balance for this period
    const totalRes = await query(
      `SELECT 
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
         COALESCE(SUM(tax_amount), 0) as total_tax
       FROM transactions
       WHERE user_id = $1 
         AND EXTRACT(MONTH FROM date) = $2
         AND EXTRACT(YEAR FROM date) = $3`,
      [userId, targetMonth, targetYear]
    );

    const totalIncome = parseFloat(totalRes.rows[0]?.total_income || 0);
    const totalExpense = parseFloat(totalRes.rows[0]?.total_expense || 0);
    const totalTax = parseFloat(totalRes.rows[0]?.total_tax || 0);
    const netSavings = totalIncome - totalExpense;

    // 2. Monthly trend for the entire year (12 months)
    const monthlyTrendRes = await query(
      `SELECT 
         EXTRACT(MONTH FROM date) as m_num,
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
       FROM transactions
       WHERE user_id = $1 AND EXTRACT(YEAR FROM date) = $2
       GROUP BY EXTRACT(MONTH FROM date)
       ORDER BY m_num ASC`,
      [userId, targetYear]
    );

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const trendMap = {};
    monthlyTrendRes.rows.forEach((r) => {
      trendMap[parseInt(r.m_num)] = {
        income: parseFloat(r.income),
        expense: parseFloat(r.expense),
      };
    });

    const monthlyTrends = monthNames.map((name, index) => {
      const data = trendMap[index + 1] || { income: 0, expense: 0 };
      return {
        name,
        Pemasukan: data.income,
        Pengeluaran: data.expense,
      };
    });

    // 3. Category distribution (Expenses)
    const categoryDistRes = await query(
      `SELECT 
         c.name, 
         c.color,
         c.icon,
         COALESCE(SUM(t.amount), 0) as amount
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = $1 
         AND t.type = 'expense'
         AND EXTRACT(MONTH FROM t.date) = $2
         AND EXTRACT(YEAR FROM t.date) = $3
       GROUP BY c.id, c.name, c.color, c.icon
       ORDER BY amount DESC`,
      [userId, targetMonth, targetYear]
    );

    const categoryBreakdown = categoryDistRes.rows.map((row) => ({
      name: row.name,
      color: row.color,
      icon: row.icon,
      value: parseFloat(row.amount),
      percent: totalExpense > 0 ? Math.round((parseFloat(row.amount) / totalExpense) * 100) : 0,
    }));

    // 4. Income breakdown
    const incomeDistRes = await query(
      `SELECT 
         c.name, 
         c.color,
         c.icon,
         COALESCE(SUM(t.amount), 0) as amount
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = $1 
         AND t.type = 'income'
         AND EXTRACT(MONTH FROM t.date) = $2
         AND EXTRACT(YEAR FROM t.date) = $3
       GROUP BY c.id, c.name, c.color, c.icon
       ORDER BY amount DESC`,
      [userId, targetMonth, targetYear]
    );

    const incomeBreakdown = incomeDistRes.rows.map((row) => ({
      name: row.name,
      color: row.color,
      icon: row.icon,
      value: parseFloat(row.amount),
      percent: totalIncome > 0 ? Math.round((parseFloat(row.amount) / totalIncome) * 100) : 0,
    }));

    res.json({
      totalIncome,
      totalExpense,
      totalTax,
      netSavings,
      monthlyTrends,
      categoryBreakdown,
      incomeBreakdown,
      month: targetMonth,
      year: targetYear,
    });
  } catch (error) {
    console.error('Reports error:', error);
    res.status(500).json({ error: 'Gagal memuat laporan' });
  }
});

export default router;
