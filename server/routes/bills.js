import express from 'express';
import { query } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET all bills
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(
      `SELECT b.*, w.name as wallet_name, w.icon as wallet_icon
       FROM bills b
       LEFT JOIN wallets w ON b.wallet_id = w.id
       WHERE b.user_id = $1
       ORDER BY b.due_day ASC`,
      [userId]
    );

    const now = new Date();
    const currentDay = now.getDate();

    const billsWithStatus = result.rows.map((bill) => {
      const daysUntilDue = bill.due_day - currentDay;
      let status = 'upcoming'; // upcoming, due_today, overdue, paid

      if (bill.is_paid) {
        status = 'paid';
      } else if (daysUntilDue < 0) {
        status = 'overdue';
      } else if (daysUntilDue === 0) {
        status = 'due_today';
      }

      return {
        ...bill,
        status,
        daysUntilDue,
      };
    });

    res.json(billsWithStatus);
  } catch (error) {
    console.error('Get bills error:', error);
    res.status(500).json({ error: 'Gagal memuat daftar tagihan' });
  }
});

// POST new bill
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, amount, due_day = 1, category = 'Langganan', wallet_id, icon = '📅' } = req.body;

    if (!name || !amount) {
      return res.status(400).json({ error: 'Nama dan nominal tagihan wajib diisi' });
    }

    const result = await query(
      `INSERT INTO bills (user_id, wallet_id, name, amount, due_day, category, icon)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, wallet_id || null, name, parseFloat(amount), parseInt(due_day), category, icon]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create bill error:', error);
    res.status(500).json({ error: 'Gagal menambahkan tagihan' });
  }
});

// PUT pay bill
router.put('/:id/pay', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { wallet_id } = req.body;

    const billRes = await query(`SELECT * FROM bills WHERE id = $1 AND user_id = $2`, [id, userId]);
    if (billRes.rows.length === 0) {
      return res.status(404).json({ error: 'Tagihan tidak ditemukan' });
    }
    const bill = billRes.rows[0];

    const targetWalletId = wallet_id || bill.wallet_id;

    // Deduct from wallet if provided
    if (targetWalletId) {
      await query(`UPDATE wallets SET balance = balance - $1 WHERE id = $2 AND user_id = $3`, [
        bill.amount,
        targetWalletId,
        userId,
      ]);

      await query(
        `INSERT INTO transactions (user_id, wallet_id, amount, type, description, date)
         VALUES ($1, $2, $3, 'expense', $4, CURRENT_DATE)`,
        [userId, targetWalletId, bill.amount, `Bayar tagihan: ${bill.name}`]
      );
    }

    const updated = await query(
      `UPDATE bills SET is_paid = TRUE WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, userId]
    );

    res.json({ message: 'Tagihan berhasil ditandai telah dibayar', bill: updated.rows[0] });
  } catch (error) {
    console.error('Pay bill error:', error);
    res.status(500).json({ error: 'Gagal memperbarui status tagihan' });
  }
});

// DELETE bill
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    await query(`DELETE FROM bills WHERE id = $1 AND user_id = $2`, [id, userId]);
    res.json({ message: 'Tagihan berhasil dihapus' });
  } catch (error) {
    console.error('Delete bill error:', error);
    res.status(500).json({ error: 'Gagal menghapus tagihan' });
  }
});

export default router;
