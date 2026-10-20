import express from 'express';
import { query } from '../db.js';
import { authenticate } from '../middleware/auth.js';
import {
  sendWhatsApp,
  formatPhoneNumber,
  triggerTestReminderForUser,
  runHourlyReminderCheck,
  getWIBDateTime,
} from '../reminder.js';

const router = express.Router();

/**
 * GET /api/reminder/settings
 * Get user's reminder settings and phone verification status
 */
router.get('/settings', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT phone_number, reminder_enabled, reminder_hour, phone_verified, last_reminder_date 
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get reminder settings error:', err);
    res.status(500).json({ error: 'Gagal memuat pengaturan reminder' });
  }
});

/**
 * PUT /api/reminder/settings
 * Save user's phone number and reminder preferences
 */
router.put('/settings', authenticate, async (req, res) => {
  try {
    const { phone_number, reminder_enabled, reminder_hour } = req.body;

    // Get current user data
    const userRes = await query(
      'SELECT phone_number, phone_verified FROM users WHERE id = $1',
      [req.user.id]
    );
    const currentUser = userRes.rows[0];

    // Validate reminder_hour
    const hour = parseInt(reminder_hour ?? 20, 10);
    if (isNaN(hour) || hour < 0 || hour > 23) {
      return res.status(400).json({ error: 'Jam pengingat harus berada di antara 0 dan 23.' });
    }

    let cleanPhone = null;
    let shouldResetVerification = false;

    if (phone_number !== undefined && phone_number !== null && phone_number !== '') {
      cleanPhone = formatPhoneNumber(phone_number);
      if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        return res.status(400).json({ error: 'Nomor HP tidak valid (minimal 10 digit)' });
      }

      // Check if another user has verified this phone number
      const conflict = await query(
        `SELECT id FROM users 
         WHERE phone_number = $1 AND id != $2 AND phone_verified = TRUE`,
        [cleanPhone, req.user.id]
      );
      if (conflict.rows.length > 0) {
        return res.status(400).json({
          error: 'Nomor HP ini sudah digunakan dan diverifikasi oleh akun lain.',
        });
      }

      // If phone changed, reset phone_verified
      if (currentUser?.phone_number && currentUser.phone_number !== cleanPhone) {
        shouldResetVerification = true;
      }
    } else {
      // User removed their phone number
      shouldResetVerification = true;
    }

    const newVerified = shouldResetVerification ? false : (currentUser?.phone_verified || false);
    const isEnabled = (reminder_enabled === true || reminder_enabled === 'true') && cleanPhone !== null;

    const hourChanged = currentUser?.reminder_hour !== hour;

    await query(
      `UPDATE users 
       SET phone_number = $1, 
           reminder_enabled = $2, 
           reminder_hour = $3,
           phone_verified = $4,
           last_reminder_date = CASE WHEN $6 = TRUE THEN NULL ELSE last_reminder_date END,
           updated_at = NOW()
       WHERE id = $5`,
      [cleanPhone, isEnabled, hour, newVerified, req.user.id, hourChanged]
    );

    // If reminder is enabled, phone is verified, and the hour matches current WIB hour:
    // Run reminder check so user receives it without waiting 24 hours
    if (isEnabled && newVerified) {
      const { hour: currentWIBHour } = getWIBDateTime();
      if (hour === currentWIBHour) {
        runHourlyReminderCheck().catch((err) =>
          console.error('[Reminder] Auto check on save error:', err.message)
        );
      }
    }

    res.json({
      message: 'Pengaturan reminder berhasil disimpan',
      phone_verified: newVerified,
      phone_number: cleanPhone,
    });
  } catch (err) {
    console.error('Save reminder settings error:', err);
    res.status(500).json({ error: 'Gagal menyimpan pengaturan reminder' });
  }
});

/**
 * POST /api/reminder/send-otp
 * Generate a 6-digit OTP and send via WhatsApp
 */
router.post('/send-otp', authenticate, async (req, res) => {
  try {
    const { phone_number } = req.body;

    let targetPhone = phone_number;
    if (!targetPhone) {
      const userRes = await query('SELECT phone_number FROM users WHERE id = $1', [req.user.id]);
      targetPhone = userRes.rows[0]?.phone_number;
    }

    if (!targetPhone) {
      return res.status(400).json({ error: 'Masukkan nomor WhatsApp terlebih dahulu.' });
    }

    const cleanPhone = formatPhoneNumber(targetPhone);
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      return res.status(400).json({ error: 'Nomor WhatsApp tidak valid (10-15 digit).' });
    }

    // Check if phone number is verified by another user
    const conflict = await query(
      `SELECT id FROM users WHERE phone_number = $1 AND id != $2 AND phone_verified = TRUE`,
      [cleanPhone, req.user.id]
    );
    if (conflict.rows.length > 0) {
      return res.status(400).json({
        error: 'Nomor WhatsApp ini sudah diverifikasi oleh akun lain.',
      });
    }

    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate old OTPs for this user
    await query(
      `UPDATE phone_otps SET is_used = TRUE WHERE user_id = $1 AND is_used = FALSE`,
      [req.user.id]
    );

    // Insert new OTP
    await query(
      `INSERT INTO phone_otps (user_id, phone_number, otp_code, expires_at) 
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, cleanPhone, otpCode, expiresAt]
    );

    // Save phone to user profile if not saved
    await query(
      `UPDATE users SET phone_number = $1, updated_at = NOW() WHERE id = $2`,
      [cleanPhone, req.user.id]
    );

    // Send via WhatsApp
    const message =
      `🔐 *Kode Verifikasi Money Management*\n\n` +
      `Kode OTP kamu adalah: *${otpCode}*\n\n` +
      `Kode ini berlaku selama 10 menit. Masukkan kode ini pada aplikasi untuk mengaktifkan pengingat WhatsApp kamu.\n\n` +
      `_Jangan bagikan kode verifikasi ini kepada siapapun._`;

    const sendRes = await sendWhatsApp(cleanPhone, message);

    if (!sendRes.success) {
      return res.status(400).json({
        error: sendRes.reason || 'Gagal mengirim kode OTP ke WhatsApp. Pastikan nomor sudah benar dan Fonnte aktif.',
      });
    }

    res.json({
      message: `Kode verifikasi telah dikirim ke WhatsApp +${cleanPhone}. Silakan cek pesan masuk kamu.`,
      phone_number: cleanPhone,
    });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ error: 'Gagal mengirim kode verifikasi: ' + err.message });
  }
});

/**
 * POST /api/reminder/verify-otp
 * Verify 6-digit OTP code and mark phone_verified = true
 */
router.post('/verify-otp', authenticate, async (req, res) => {
  try {
    const { otp_code, phone_number } = req.body;
    if (!otp_code) {
      return res.status(400).json({ error: 'Kode OTP wajib diisi.' });
    }

    const cleanCode = otp_code.toString().trim();

    // Check if matching OTP exists and is valid
    const otpResult = await query(
      `SELECT id, phone_number 
       FROM phone_otps 
       WHERE user_id = $1 
         AND otp_code = $2 
         AND is_used = FALSE 
         AND expires_at > NOW()
       ORDER BY created_at DESC 
       LIMIT 1`,
      [req.user.id, cleanCode]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({
        error: 'Kode OTP salah atau sudah kedaluwarsa. Silakan minta kode baru.',
      });
    }

    const otpRecord = otpResult.rows[0];
    const verifiedPhone = otpRecord.phone_number || (phone_number ? formatPhoneNumber(phone_number) : null);

    // Mark OTP as used
    await query(`UPDATE phone_otps SET is_used = TRUE WHERE id = $1`, [otpRecord.id]);

    // Update user to verified and enable reminder
    await query(
      `UPDATE users 
       SET phone_number = $1, 
           phone_verified = TRUE, 
           reminder_enabled = TRUE, 
           updated_at = NOW() 
       WHERE id = $2`,
      [verifiedPhone, req.user.id]
    );

    res.json({
      message: '🎉 Nomor WhatsApp berhasil diverifikasi! Pengingat harian otomatis aktif.',
      phone_verified: true,
      phone_number: verifiedPhone,
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'Gagal memverifikasi OTP: ' + err.message });
  }
});

/**
 * POST /api/reminder/test
 * Trigger a test reminder for the current user (sends WA immediately)
 */
router.post('/test', authenticate, async (req, res) => {
  try {
    const result = await triggerTestReminderForUser(req.user.id);
    res.json({
      message: 'Pesan tes berhasil dikirim! Silakan periksa WhatsApp kamu.',
      data: result.data,
    });
  } catch (err) {
    console.error('Test reminder error:', err);
    res.status(400).json({ error: err.message || 'Gagal mengirim pesan tes reminder' });
  }
});

/**
 * POST /api/reminder/send-wa
 * Send a one-off WA message directly
 */
router.post('/send-wa', authenticate, async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ error: 'phone dan message wajib diisi' });
    }

    const sendRes = await sendWhatsApp(phone, message);
    if (sendRes.success) {
      res.json({ message: `Pesan berhasil dikirim ke +${formatPhoneNumber(phone)}` });
    } else {
      res.status(400).json({ error: sendRes.reason || 'Gagal mengirim pesan' });
    }
  } catch (err) {
    console.error('Send WA error:', err.message);
    res.status(500).json({ error: 'Gagal kirim WA: ' + err.message });
  }
});

export default router;
