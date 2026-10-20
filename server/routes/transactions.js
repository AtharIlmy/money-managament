import express from 'express';
import { query } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET all transactions with filters
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, wallet_id, category_id, search, limit = 50 } = req.query;

    let sql = `
      SELECT t.*, 
             c.name as category_name, c.icon as category_icon, c.color as category_color,
             w.name as wallet_name, w.icon as wallet_icon
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN wallets w ON t.wallet_id = w.id
      WHERE t.user_id = $1
    `;
    const params = [userId];

    if (type && type !== 'all') {
      params.push(type);
      sql += ` AND t.type = $${params.length}`;
    }

    if (wallet_id && wallet_id !== 'all') {
      params.push(wallet_id);
      sql += ` AND t.wallet_id = $${params.length}`;
    }

    if (category_id && category_id !== 'all') {
      params.push(category_id);
      sql += ` AND t.category_id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (t.description ILIKE $${params.length} OR c.name ILIKE $${params.length})`;
    }

    sql += ` ORDER BY t.date DESC, t.created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Gagal mengambil data transaksi' });
  }
});

// POST new transaction
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { wallet_id, category_id, amount, tax_amount, type, description, date } = req.body;

    if (!amount || !type || !wallet_id) {
      return res.status(400).json({ error: 'Dompet, jumlah uang, dan tipe transaksi wajib diisi' });
    }

    const numAmount = parseFloat(amount);
    const numTax = Math.max(0, parseFloat(tax_amount || 0));
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Jumlah harus berupa angka positif' });
    }

    // Insert transaction
    const transResult = await query(
      `INSERT INTO transactions (user_id, wallet_id, category_id, amount, tax_amount, type, description, date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [userId, wallet_id, category_id || null, numAmount, numTax, type, description || '', date || new Date()]
    );

    // Update wallet balance
    if (type === 'income') {
      await query(`UPDATE wallets SET balance = balance + $1 WHERE id = $2 AND user_id = $3`, [
        numAmount,
        wallet_id,
        userId,
      ]);
    } else if (type === 'expense') {
      await query(`UPDATE wallets SET balance = balance - $1 WHERE id = $2 AND user_id = $3`, [
        numAmount,
        wallet_id,
        userId,
      ]);
    }

    res.status(201).json(transResult.rows[0]);
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Gagal menyimpan transaksi' });
  }
});

// PUT update transaction
router.put('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const transId = req.params.id;
    const { wallet_id, category_id, amount, tax_amount, type, description, date } = req.body;

    if (!amount || !type || !wallet_id) {
      return res.status(400).json({ error: 'Dompet, jumlah uang, dan tipe transaksi wajib diisi' });
    }

    const numAmount = parseFloat(amount);
    const numTax = Math.max(0, parseFloat(tax_amount || 0));
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Jumlah harus berupa angka positif' });
    }

    // 1. Get existing transaction
    const transRes = await query(`SELECT * FROM transactions WHERE id = $1 AND user_id = $2`, [
      transId,
      userId,
    ]);
    if (transRes.rows.length === 0) {
      return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    }

    const oldTrans = transRes.rows[0];

    // 2. Revert previous wallet balance effect
    if (oldTrans.wallet_id) {
      if (oldTrans.type === 'income') {
        await query(`UPDATE wallets SET balance = balance - $1 WHERE id = $2 AND user_id = $3`, [
          oldTrans.amount,
          oldTrans.wallet_id,
          userId,
        ]);
      } else if (oldTrans.type === 'expense') {
        await query(`UPDATE wallets SET balance = balance + $1 WHERE id = $2 AND user_id = $3`, [
          oldTrans.amount,
          oldTrans.wallet_id,
          userId,
        ]);
      }
    }

    // 3. Apply new wallet balance effect
    if (type === 'income') {
      await query(`UPDATE wallets SET balance = balance + $1 WHERE id = $2 AND user_id = $3`, [
        numAmount,
        wallet_id,
        userId,
      ]);
    } else if (type === 'expense') {
      await query(`UPDATE wallets SET balance = balance - $1 WHERE id = $2 AND user_id = $3`, [
        numAmount,
        wallet_id,
        userId,
      ]);
    }

    // 4. Update transaction row
    const updateRes = await query(
      `UPDATE transactions 
       SET wallet_id = $1, category_id = $2, amount = $3, tax_amount = $4, type = $5, description = $6, date = $7
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [wallet_id, category_id || null, numAmount, numTax, type, description || '', date || oldTrans.date, transId, userId]
    );

    res.json(updateRes.rows[0]);
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Gagal memperbarui transaksi' });
  }
});

// DELETE transaction
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const transId = req.params.id;

    // Get transaction details first
    const transRes = await query(`SELECT * FROM transactions WHERE id = $1 AND user_id = $2`, [
      transId,
      userId,
    ]);
    if (transRes.rows.length === 0) {
      return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    }

    const trans = transRes.rows[0];

    // Revert wallet balance
    if (trans.wallet_id) {
      if (trans.type === 'income') {
        await query(`UPDATE wallets SET balance = balance - $1 WHERE id = $2 AND user_id = $3`, [
          trans.amount,
          trans.wallet_id,
          userId,
        ]);
      } else if (trans.type === 'expense') {
        await query(`UPDATE wallets SET balance = balance + $1 WHERE id = $2 AND user_id = $3`, [
          trans.amount,
          trans.wallet_id,
          userId,
        ]);
      }
    }

    await query(`DELETE FROM transactions WHERE id = $1 AND user_id = $2`, [transId, userId]);
    res.json({ message: 'Transaksi berhasil dihapus' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Gagal menghapus transaksi' });
  }
});

export default router;
