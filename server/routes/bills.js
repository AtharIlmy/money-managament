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

// PUT edit bill
router.put('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, amount, due_day, category, icon, wallet_id } = req.body;

    const result = await query(
      `UPDATE bills
       SET name = COALESCE($1, name),
           amount = COALESCE($2, amount),
           due_day = COALESCE($3, due_day),
           category = COALESCE($4, category),
           icon = COALESCE($5, icon),
           wallet_id = COALESCE($6, wallet_id)
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [name !== undefined ? name : null,
        amount !== undefined ? parseFloat(amount) : null,
        due_day !== undefined ? parseInt(due_day) : null,
        category !== undefined ? category : null,
        icon !== undefined ? icon : null,
        wallet_id !== undefined ? parseInt(wallet_id) : null,
        id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tagihan tidak ditemukan' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Edit bill error:', error);
    res.status(500).json({ error: 'Gagal memperbarui tagihan' });
  }
});

// GET CSV export for bills report
router.get('/export', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;
    const targetYear = parseInt(year) || new Date().getFullYear();
    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;

    // Fetch all transactions for the period
    const txResult = await query(
      `SELECT t.amount, t.type, t.description,
              c.name as category_name, c.icon as category_icon, c.color as category_color,
              w.name as wallet_name, w.icon as wallet_icon, t.date
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN wallets w ON t.wallet_id = w.id
       WHERE t.user_id = $1 AND EXTRACT(MONTH FROM t.date) = $2 AND EXTRACT(YEAR FROM t.date) = $3
       ORDER BY t.date DESC`,
      [userId, targetMonth, targetYear]
    );

    const rows = txResult.rows;
    const header = ['Tanggal', 'Keterangan', 'Kategori', 'Gunakan Dompet', 'Jenis', 'Jumlah', 'Diskon'];
    const csvRows = rows.map((r) => [
      r.date,
      r.description || '',
      r.category_name || '',
      r.wallet_name || '',
      r.type || '',
      parseFloat(r.amount || 0).toLocaleString('id-ID'),
      parseFloat(r.tax_amount || 0).toLocaleString('id-ID'),
    ]);
    const csv = [header.join(','), ...csvRows.map(row => row.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=laporan_${targetYear}_${String(targetMonth).padStart(2,'0')}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ error: 'Gagal mengekspor CSV' });
  }
});

export default router;
