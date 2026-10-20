import express from 'express';
import { query } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.query;

    let sql = 'SELECT * FROM categories WHERE user_id = $1';
    const params = [userId];

    if (type) {
      sql += ' AND type = $2';
      params.push(type);
    }

    sql += ' ORDER BY id ASC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Gagal mengambil kategori' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, type, icon = '📌', color = '#84A98C' } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Nama dan jenis kategori wajib diisi' });
    }

    const result = await query(
      `INSERT INTO categories (user_id, name, type, icon, color)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, name, type, icon, color]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Gagal membuat kategori baru' });
  }
});

export default router;
