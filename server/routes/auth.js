import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, seedDefaultData } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'arus_secret_key_2024_money_management';

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone_number } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nama, email, dan password wajib diisi' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter' });
    }

    // Validate and normalize phone number if provided
    let cleanPhone = null;
    if (phone_number && phone_number.toString().trim()) {
      cleanPhone = phone_number.toString().replace(/[^0-9]/g, '');
      // Normalize: 08xxx → 628xxx
      if (cleanPhone.startsWith('08')) {
        cleanPhone = '62' + cleanPhone.slice(1);
      } else if (cleanPhone.startsWith('8')) {
        cleanPhone = '62' + cleanPhone;
      }

      if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        return res.status(400).json({ error: 'Nomor WhatsApp tidak valid (10-15 digit)' });
      }

      // Check if phone number is already verified by another user
      const phoneConflict = await query(
        'SELECT id FROM users WHERE phone_number = $1 AND phone_verified = TRUE',
        [cleanPhone]
      );
      if (phoneConflict.rows.length > 0) {
        return res.status(400).json({ error: 'Nomor WhatsApp ini sudah digunakan oleh akun lain.' });
      }
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email sudah terdaftar. Silakan masuk.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (name, email, password_hash, phone_number, reminder_enabled, reminder_hour, phone_verified, updated_at) 
       VALUES ($1, $2, $3, $4, FALSE, 20, FALSE, NOW()) 
       RETURNING id, name, email, phone_number, reminder_enabled, phone_verified`,
      [name, email, hashedPassword, cleanPhone]
    );

    const user = result.rows[0];
    await seedDefaultData(user.id);

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, phone_number: user.phone_number, phone_verified: user.phone_verified },
      token,
      message: cleanPhone
        ? 'Pendaftaran berhasil! Silakan verifikasi nomor WhatsApp di menu Pengaturan untuk mengaktifkan pengingat.'
        : 'Pendaftaran berhasil',
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server saat mendaftar' });
  }
});


// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan kata sandi wajib diisi' });
    }

    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email atau kata sandi tidak sesuai' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Email atau kata sandi tidak sesuai' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar },
      token,
      message: 'Berhasil masuk',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server saat masuk' });
  }
});

// Me (Current user)
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT id, name, email, avatar, created_at FROM users WHERE id = $1', [
      req.user.id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Gagal memuat profil' });
  }
});

// Update Profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Nama dan email wajib diisi' });
    }

    // Check if email already taken by someone else
    const checkEmail = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, req.user.id]);
    if (checkEmail.rows.length > 0) {
      return res.status(400).json({ error: 'Email tersebut sudah digunakan oleh akun lain' });
    }

    const result = await query(
      'UPDATE users SET name = $1, email = $2, updated_at = NOW() WHERE id = $3 RETURNING id, name, email, avatar',
      [name, email, req.user.id]
    );

    res.json({
      message: 'Profil berhasil diperbarui',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Gagal memperbarui profil' });
  }
});

// Update Password
router.put('/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Kata sandi saat ini dan kata sandi baru wajib diisi' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Kata sandi baru minimal 6 karakter' });
    }

    const userResult = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    const match = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
    if (!match) {
      return res.status(400).json({ error: 'Kata sandi saat ini salah' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [
      hashedPassword,
      req.user.id,
    ]);

    res.json({ message: 'Kata sandi berhasil diperbarui' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Gagal memperbarui kata sandi' });
  }
});

// Verify Email (Check if email exists for password reset)
router.post('/verify-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email wajib diisi' });
    }

    const result = await query('SELECT id, name, email FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Email tidak ditemukan dalam sistem' });
    }

    res.json({
      exists: true,
      name: result.rows[0].name,
      email: result.rows[0].email,
      message: 'Email ditemukan',
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Gagal memverifikasi email' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email dan kata sandi baru wajib diisi' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Kata sandi baru minimal 6 karakter' });
    }

    const check = await query('SELECT id, name FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Pengguna dengan email tersebut tidak ditemukan' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = $1 WHERE LOWER(email) = LOWER($2)', [hashedPassword, email.trim()]);

    res.json({ message: 'Kata sandi berhasil diperbarui. Silakan masuk dengan kata sandi baru.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Gagal mereset kata sandi' });
  }
});

export default router;
