/**
 * Hourly Reminder Scheduler
 * Runs every hour on the hour (Asia/Jakarta WIB)
 * Checks users who have:
 *  - reminder_enabled = true
 *  - phone_verified = true
 *  - reminder_hour = current WIB hour (0-23)
 *  - last_reminder_date is NULL or < today
 *  - 0 transactions recorded today
 * Sends WhatsApp notification via Fonnte API and marks last_reminder_date = today.
 */

import cron from 'node-cron';
import axios from 'axios';
import { query } from './db.js';

// Fonnte API token from .env
const FONNTE_TOKEN = process.env.FONNTE_TOKEN || '';

/**
 * Format phone number to international format (628xxx)
 */
export function formatPhoneNumber(phoneNumber) {
  if (!phoneNumber) return '';
  let phone = phoneNumber.toString().replace(/[^0-9]/g, '');
  if (phone.startsWith('08')) {
    phone = '62' + phone.slice(1);
  } else if (phone.startsWith('8')) {
    phone = '62' + phone;
  }
  return phone;
}

/**
 * Send WhatsApp message via Fonnte API
 */
export async function sendWhatsApp(phoneNumber, message) {
  const token = process.env.FONNTE_TOKEN || FONNTE_TOKEN;
  if (!token || token.includes('paste_token')) {
    console.warn('[Reminder] FONNTE_TOKEN belum diset di .env. Pesan WhatsApp tidak terkirim.');
    return { success: false, reason: 'FONNTE_TOKEN belum dikonfigurasi di .env' };
  }

  const phone = formatPhoneNumber(phoneNumber);
  if (!phone || phone.length < 10) {
    return { success: false, reason: 'Nomor HP tidak valid' };
  }

  try {
    const response = await axios.post(
      'https://api.fonnte.com/send',
      {
        target: phone,
        message: message,
        countryCode: '62',
      },
      {
        headers: {
          Authorization: token,
        },
        timeout: 10000,
      }
    );

    if (response.data?.status === true) {
      console.log(`[Reminder] ✅ WA terkirim ke +${phone}`);
      return { success: true, data: response.data };
    } else {
      const reason = response.data?.reason || response.data?.message || 'Gagal mengirim pesan';
      console.warn(`[Reminder] ⚠️ Gagal kirim ke +${phone}:`, reason);
      return { success: false, reason };
    }
  } catch (err) {
    const errorMsg = err.response?.data?.reason || err.response?.data?.message || err.message;
    console.error(`[Reminder] ❌ Error kirim WA ke +${phone}:`, errorMsg);
    return { success: false, reason: errorMsg };
  }
}

/**
 * Get current date (YYYY-MM-DD) and hour (0-23) in Asia/Jakarta (WIB)
 */
export function getWIBDateTime() {
  const now = new Date();
  
  // Date in YYYY-MM-DD
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

  // Hour in 0-23
  const hourStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    hour: 'numeric',
    hour12: false,
  }).format(now);

  return {
    date: dateStr,
    hour: parseInt(hourStr, 10),
  };
}

/**
 * Run daily reminder check at 20:00 WIB:
 * Find all users with reminder_enabled + phone_verified who haven't entered any transactions today
 */
export async function runDailyReminderCheck() {
  const { date: todayStr, hour: currentHour } = getWIBDateTime();
  console.log(`[Reminder] 🔔 Memeriksa pengingat jam ${currentHour}:00 WIB (Tanggal: ${todayStr})`);

  try {
    // Select all enabled + verified users who haven't been reminded today
    const usersResult = await query(
      `SELECT id, name, phone_number, last_reminder_date
       FROM users 
       WHERE phone_number IS NOT NULL 
         AND phone_number != ''
         AND reminder_enabled = TRUE
         AND phone_verified = TRUE
         AND (
           last_reminder_date IS NULL 
           OR DATE(last_reminder_date AT TIME ZONE 'Asia/Jakarta') < $1::DATE
         )`,
      [todayStr]
    );

    if (usersResult.rows.length === 0) {
      console.log(`[Reminder] Semua user sudah dicatat atau belum ada yang terdaftar.`);
      return;
    }

    console.log(`[Reminder] Memeriksa ${usersResult.rows.length} user...`);

    for (const user of usersResult.rows) {
      try {
        const txResult = await query(
          `SELECT COUNT(*) as count FROM transactions 
           WHERE user_id = $1 AND date = $2`,
          [user.id, todayStr]
        );

        const txCount = parseInt(txResult.rows[0]?.count || '0', 10);

        if (txCount === 0) {
          const firstName = (user.name || 'Kamu').split(' ')[0];
          const displayDate = todayStr.split('-').reverse().join('/');
          const message =
            `⏰ *Pengingat Money Management*\n\n` +
            `Halo ${firstName}! Kamu belum mencatat transaksi apapun hari ini (${displayDate}).\n\n` +
            `💸 Jangan lupa catat pemasukan atau pengeluaran hari ini agar arus keuanganmu tetap rapi dan terukur.\n\n` +
            `📊 Buka Money Management sekarang:\nhttp://localhost:3000/transaksi\n\n` +
            `_Pesan otomatis dari Money Management_`;

          const result = await sendWhatsApp(user.phone_number, message);

          if (result.success) {
            await query(
              `UPDATE users 
               SET last_reminder_date = $1::DATE, updated_at = NOW() 
               WHERE id = $2`,
              [todayStr, user.id]
            );
            console.log(`[Reminder] ✓ Reminder terkirim ke ${user.name}.`);
          }
        } else {
          console.log(`[Reminder] ✓ ${user.name} sudah mencatat ${txCount} transaksi hari ini — tidak perlu reminder.`);
        }
      } catch (userErr) {
        console.error(`[Reminder] Error saat memproses user ${user.id}:`, userErr.message);
      }
    }
  } catch (err) {
    console.error('[Reminder] Database error saat cek reminder:', err.message);
  }
}

// Backward-compat alias
export const runHourlyReminderCheck = runDailyReminderCheck;

/**
 * Initialize daily reminder scheduler
 * Runs at exactly 20:00 WIB (Asia/Jakarta) every day — no user configuration needed
 */
export function initReminderScheduler() {
  console.log(`[Reminder] 📅 Inisialisasi scheduler pengingat otomatis jam 20:00 WIB setiap hari...`);

  cron.schedule(
    '0 20 * * *',
    () => {
      runDailyReminderCheck();
    },
    {
      scheduled: true,
      timezone: 'Asia/Jakarta',
    }
  );

  console.log(`[Reminder] ✅ Scheduler aktif: pengingat WA otomatis terkirim jam 20:00 WIB setiap hari jika belum ada transaksi.`);
}

/**
 * Send a test reminder to a specific user immediately
 */
export async function triggerTestReminderForUser(userId) {
  const { date: todayStr } = getWIBDateTime();
  const result = await query(
    `SELECT id, name, phone_number, phone_verified FROM users WHERE id = $1`,
    [userId]
  );
  const user = result.rows[0];
  if (!user) throw new Error('User tidak ditemukan');
  if (!user.phone_number) throw new Error('Nomor HP belum diisi');

  const firstName = (user.name || 'Kamu').split(' ')[0];
  const displayDate = todayStr.split('-').reverse().join('/');
  const message =
    `🧪 *Tes Pengingat WhatsApp Money Management*\n\n` +
    `Halo ${firstName}!\n` +
    `Ini adalah pesan pengujian notifikasi WhatsApp dari Money Management (${displayDate}).\n\n` +
    `Fitur reminder kamu aktif dan siap mengingatkan jika belum mencatat transaksi harian!\n\n` +
    `_Pesan otomatis dari Money Management_`;

  const sendResult = await sendWhatsApp(user.phone_number, message);
  if (!sendResult.success) {
    throw new Error(sendResult.reason || 'Gagal mengirim pesan melalui Fonnte');
  }

  return sendResult;
}
