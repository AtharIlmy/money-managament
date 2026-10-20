import express from 'express';
import { query } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(
      `SELECT w.*, 
         (SELECT COUNT(*) FROM transactions t WHERE t.wallet_id = w.id) as transaction_count
       FROM wallets w
       WHERE w.user_id = $1
       ORDER BY w.id ASC`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get wallets error:', error);
    res.status(500).json({ error: 'Gagal mengambil data dompet' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, type = 'checking', balance = 0, color = '#1B4332', icon = '💳' } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nama dompet wajib diisi' });
    }

    const result = await query(
      `INSERT INTO wallets (user_id, name, type, balance, color, icon)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, name, type, parseFloat(balance) || 0, color, icon]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create wallet error:', error);
    res.status(500).json({ error: 'Gagal membuat dompet baru' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, type, balance, color, icon } = req.body;

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({ error: 'Nama dompet wajib diisi' });
    }

    const result = await query(
      `UPDATE wallets 
       SET name = COALESCE($1, name),
           type = COALESCE($2, type),
           balance = COALESCE($3, balance),
           color = COALESCE($4, color),
           icon = COALESCE($5, icon)
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [
        name !== undefined ? name.trim() : null,
        type || null,
        balance !== undefined && balance !== '' && !isNaN(parseFloat(balance)) ? parseFloat(balance) : null,
        color || null,
        icon || null,
        id,
        userId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dompet tidak ditemukan' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update wallet error:', error);
    res.status(500).json({ error: 'Gagal memperbarui dompet' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await query(`DELETE FROM wallets WHERE id = $1 AND user_id = $2 RETURNING id`, [
      id,
      userId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dompet tidak ditemukan' });
    }

    res.json({ message: 'Dompet berhasil dihapus' });
  } catch (error) {
    console.error('Delete wallet error:', error);
    res.status(500).json({ error: 'Gagal menghapus dompet' });
  }
});

// POST transfer between wallets
router.post('/transfer', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { from_wallet_id, to_wallet_id, amount, note, fee_amount } = req.body;

    const numAmount = parseFloat(amount);
    const numFee = Math.max(0, parseFloat(fee_amount || 0));
    const totalDeduction = numAmount + numFee;

    if (!from_wallet_id || !to_wallet_id || !numAmount || numAmount <= 0) {
      return res.status(400).json({ error: 'Dompet asal, dompet tujuan, dan nominal transfer wajib diisi' });
    }

    if (from_wallet_id === to_wallet_id) {
      return res.status(400).json({ error: 'Dompet asal dan tujuan tidak boleh sama' });
    }

    // Check source wallet
    const fromRes = await query(`SELECT * FROM wallets WHERE id = $1 AND user_id = $2`, [from_wallet_id, userId]);
    if (fromRes.rows.length === 0) {
      return res.status(404).json({ error: 'Dompet asal tidak ditemukan' });
    }
    const fromWallet = fromRes.rows[0];

    if (parseFloat(fromWallet.balance) < totalDeduction) {
      return res.status(400).json({
        error: `Saldo dompet asal tidak mencukupi untuk transfer & biaya admin (Total: Rp ${totalDeduction.toLocaleString('id-ID')})`,
      });
    }

    // Check destination wallet
    const toRes = await query(`SELECT * FROM wallets WHERE id = $1 AND user_id = $2`, [to_wallet_id, userId]);
    if (toRes.rows.length === 0) {
      return res.status(404).json({ error: 'Dompet tujuan tidak ditemukan' });
    }
    const toWallet = toRes.rows[0];

    // Deduct source (amount + fee)
    await query(`UPDATE wallets SET balance = balance - $1 WHERE id = $2 AND user_id = $3`, [
      totalDeduction,
      from_wallet_id,
      userId,
    ]);

    // Add destination (pure amount transferred)
    await query(`UPDATE wallets SET balance = balance + $1 WHERE id = $2 AND user_id = $3`, [
      numAmount,
      to_wallet_id,
      userId,
    ]);

    // Record transactions
    await query(
      `INSERT INTO transactions (user_id, wallet_id, amount, tax_amount, type, description, date)
       VALUES ($1, $2, $3, $4, 'transfer', $5, CURRENT_DATE)`,
      [
        userId,
        from_wallet_id,
        totalDeduction,
        numFee,
        `Transfer ke ${toWallet.name}${numFee > 0 ? ` (Biaya admin: Rp ${numFee.toLocaleString('id-ID')})` : ''}${note ? `: ${note}` : ''}`,
      ]
    );

    res.json({
      message: `Berhasil mentransfer dari ${fromWallet.name} ke ${toWallet.name}${numFee > 0 ? ` (Biaya admin Rp ${numFee.toLocaleString('id-ID')})` : ''}`,
    });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ error: 'Gagal melakukan transfer antar dompet' });
  }
});

export default router;
