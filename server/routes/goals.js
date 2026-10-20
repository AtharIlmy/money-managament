import express from 'express';
import { query } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET all goals with stats
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(
      `SELECT g.*,
         COALESCE((
           SELECT COUNT(*) FROM savings_logs sl WHERE sl.goal_id = g.id
         ), 0) as log_count
       FROM goals g 
       WHERE g.user_id = $1 
       ORDER BY g.id DESC`,
      [userId]
    );

    // Calculate smart stats
    const now = new Date();
    const enrichedGoals = result.rows.map((goal) => {
      const current = parseFloat(goal.current_amount || 0);
      const target = parseFloat(goal.target_amount || 1);
      const percentage = Math.min(Math.round((current / target) * 100), 100);
      const remainingAmount = Math.max(0, target - current);

      let daysRemaining = null;
      let monthlyRecommendation = 0;
      let dailyRecommendation = 0;

      if (goal.deadline) {
        const dead = new Date(goal.deadline);
        const diffTime = dead.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysRemaining > 0 && remainingAmount > 0) {
          dailyRecommendation = Math.round(remainingAmount / daysRemaining);
          const monthsRemaining = Math.max(1, daysRemaining / 30);
          monthlyRecommendation = Math.round(remainingAmount / monthsRemaining);
        }
      }

      return {
        ...goal,
        percentage,
        remainingAmount,
        daysRemaining,
        monthlyRecommendation,
        dailyRecommendation,
        isCompleted: current >= target,
      };
    });

    res.json(enrichedGoals);
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ error: 'Gagal memuat target tabungan' });
  }
});

// POST new goal
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      target_amount,
      current_amount = 0,
      deadline,
      category = 'Umum',
      icon = '🎯',
      color = '#1B4332',
      wallet_id,
    } = req.body;

    if (!name || !target_amount) {
      return res.status(400).json({ error: 'Nama dan target nominal wajib diisi' });
    }

    const initialAmount = parseFloat(current_amount || 0);

    const result = await query(
      `INSERT INTO goals (user_id, name, target_amount, current_amount, deadline, category, icon, color)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        userId,
        name,
        parseFloat(target_amount),
        initialAmount,
        deadline || null,
        category,
        icon,
        color,
      ]
    );

    const newGoal = result.rows[0];

    // If initial amount > 0 and wallet provided, log it and deduct from wallet
    if (initialAmount > 0 && wallet_id) {
      await query(`UPDATE wallets SET balance = balance - $1 WHERE id = $2 AND user_id = $3`, [
        initialAmount,
        wallet_id,
        userId,
      ]);

      await query(
        `INSERT INTO savings_logs (user_id, goal_id, wallet_id, amount, type, note)
         VALUES ($1, $2, $3, $4, 'deposit', 'Setoran awal buka tabungan')`,
        [userId, newGoal.id, wallet_id, initialAmount]
      );

      await query(
        `INSERT INTO transactions (user_id, wallet_id, amount, type, description, date)
         VALUES ($1, $2, $3, 'expense', $4, CURRENT_DATE)`,
        [userId, wallet_id, initialAmount, `Setor tabungan awal: ${name}`]
      );
    }

    res.status(201).json(newGoal);
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ error: 'Gagal membuat target tabungan baru' });
  }
});

// POST deposit funds into savings goal
router.post('/:id/deposit', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { amount, wallet_id, note } = req.body;

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ error: 'Nominal setoran harus lebih dari 0' });
    }

    // Check goal
    const goalRes = await query(`SELECT * FROM goals WHERE id = $1 AND user_id = $2`, [id, userId]);
    if (goalRes.rows.length === 0) {
      return res.status(404).json({ error: 'Target tabungan tidak ditemukan' });
    }
    const goal = goalRes.rows[0];

    // If wallet provided, verify wallet balance and deduct
    if (wallet_id) {
      const walRes = await query(`SELECT * FROM wallets WHERE id = $1 AND user_id = $2`, [
        wallet_id,
        userId,
      ]);
      if (walRes.rows.length === 0) {
        return res.status(404).json({ error: 'Dompet sumber tidak ditemukan' });
      }
      const wallet = walRes.rows[0];
      if (parseFloat(wallet.balance) < numAmount) {
        return res.status(400).json({ error: 'Saldo dompet tidak mencukupi untuk menabung sejumlah ini' });
      }

      await query(`UPDATE wallets SET balance = balance - $1 WHERE id = $2 AND user_id = $3`, [
        numAmount,
        wallet_id,
        userId,
      ]);

      await query(
        `INSERT INTO transactions (user_id, wallet_id, amount, type, description, date)
         VALUES ($1, $2, $3, 'expense', $4, CURRENT_DATE)`,
        [userId, wallet_id, numAmount, `Menabung untuk: ${goal.name}`]
      );
    }

    // Update goal current_amount
    const updatedGoal = await query(
      `UPDATE goals SET current_amount = current_amount + $1 WHERE id = $2 AND user_id = $3 RETURNING *`,
      [numAmount, id, userId]
    );

    // Record log
    await query(
      `INSERT INTO savings_logs (user_id, goal_id, wallet_id, amount, type, note)
       VALUES ($1, $2, $3, $4, 'deposit', $5)`,
      [userId, id, wallet_id || null, numAmount, note || `Setor tabungan`]
    );

    res.json({
      message: 'Berhasil menyetor ke tabungan!',
      goal: updatedGoal.rows[0],
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ error: 'Gagal melakukan setoran tabungan' });
  }
});

// POST withdraw funds from savings goal
router.post('/:id/withdraw', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { amount, wallet_id, note } = req.body;

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ error: 'Nominal penarikan harus lebih dari 0' });
    }

    const goalRes = await query(`SELECT * FROM goals WHERE id = $1 AND user_id = $2`, [id, userId]);
    if (goalRes.rows.length === 0) {
      return res.status(404).json({ error: 'Target tabungan tidak ditemukan' });
    }
    const goal = goalRes.rows[0];

    if (parseFloat(goal.current_amount) < numAmount) {
      return res.status(400).json({ error: 'Saldo tabungan tidak mencukupi untuk penarikan ini' });
    }

    // Return funds to wallet if specified
    if (wallet_id) {
      await query(`UPDATE wallets SET balance = balance + $1 WHERE id = $2 AND user_id = $3`, [
        numAmount,
        wallet_id,
        userId,
      ]);

      await query(
        `INSERT INTO transactions (user_id, wallet_id, amount, type, description, date)
         VALUES ($1, $2, $3, 'income', $4, CURRENT_DATE)`,
        [userId, wallet_id, numAmount, `Tarik tabungan: ${goal.name}`]
      );
    }

    // Deduct goal current_amount
    const updatedGoal = await query(
      `UPDATE goals SET current_amount = current_amount - $1 WHERE id = $2 AND user_id = $3 RETURNING *`,
      [numAmount, id, userId]
    );

    // Record log
    await query(
      `INSERT INTO savings_logs (user_id, goal_id, wallet_id, amount, type, note)
       VALUES ($1, $2, $3, $4, 'withdraw', $5)`,
      [userId, id, wallet_id || null, numAmount, note || `Tarik tabungan`]
    );

    res.json({
      message: 'Berhasil menarik dana dari tabungan!',
      goal: updatedGoal.rows[0],
    });
  } catch (error) {
    console.error('Withdraw error:', error);
    res.status(500).json({ error: 'Gagal melakukan penarikan tabungan' });
  }
});

// GET logs for a specific goal
router.get('/:id/logs', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const logs = await query(
      `SELECT sl.*, w.name as wallet_name, w.icon as wallet_icon
       FROM savings_logs sl
       LEFT JOIN wallets w ON sl.wallet_id = w.id
       WHERE sl.goal_id = $1 AND sl.user_id = $2
       ORDER BY sl.created_at DESC`,
      [id, userId]
    );

    res.json(logs.rows);
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Gagal memuat riwayat tabungan' });
  }
});

// PUT update goal details
router.put('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, target_amount, current_amount, deadline, category, icon, color } = req.body;

    const result = await query(
      `UPDATE goals 
       SET name = COALESCE($1, name),
           target_amount = COALESCE($2, target_amount),
           current_amount = COALESCE($3, current_amount),
           deadline = COALESCE($4, deadline),
           category = COALESCE($5, category),
           icon = COALESCE($6, icon),
           color = COALESCE($7, color)
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [
        name,
        target_amount !== undefined ? parseFloat(target_amount) : null,
        current_amount !== undefined ? parseFloat(current_amount) : null,
        deadline,
        category,
        icon,
        color,
        id,
        userId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Target tidak ditemukan' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ error: 'Gagal memperbarui target tabungan' });
  }
});

// DELETE goal
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    await query(`DELETE FROM goals WHERE id = $1 AND user_id = $2`, [id, userId]);
    res.json({ message: 'Target tabungan berhasil dihapus' });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ error: 'Gagal menghapus target tabungan' });
  }
});

export default router;
