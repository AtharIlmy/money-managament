import express from 'express';
import { query } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(
      `SELECT b.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
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
       ORDER BY b.id DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ error: 'Gagal memuat anggaran' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { category_id, amount, start_date, end_date } = req.body;

    if (!category_id || !amount) {
      return res.status(400).json({ error: 'Kategori dan nominal anggaran wajib diisi' });
    }

    const start = start_date || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = end_date || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    const result = await query(
      `INSERT INTO budgets (user_id, category_id, amount, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, category_id, parseFloat(amount), start, end]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({ error: 'Gagal membuat anggaran' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    await query(`DELETE FROM budgets WHERE id = $1 AND user_id = $2`, [id, userId]);
    res.json({ message: 'Anggaran berhasil dihapus' });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ error: 'Gagal menghapus anggaran' });
  }
});

export default router;
