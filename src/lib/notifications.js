// Utility for Web Push Notifications & Mobile Device Alerts
import { formatRupiah } from './utils';

export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (!isNotificationSupported()) {
    return {
      success: false,
      status: 'unsupported',
      message: 'Perangkat atau peramban ini tidak mendukung Notifikasi Web native.',
    };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem('user_mobile_notif_enabled', 'true');
      return { success: true, status: 'granted', message: 'Notifikasi berhasil diaktifkan!' };
    } else {
      localStorage.setItem('user_mobile_notif_enabled', 'false');
      return {
        success: false,
        status: permission,
        message: 'Izin notifikasi belum diizinkan. Anda dapat mengaktifkannya di pengaturan peramban/HP.',
      };
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return { success: false, status: 'error', message: error.message };
  }
}

/**
 * Send native push notification to device/mobile
 */
export function sendPushNotification({
  title = '⏰ Money Management',
  body = 'Catatan keuangan baru berhasil disimpan.',
  icon = '/logo.svg',
  tag = 'money-notification',
  url = '/transaksi',
} = {}) {
  if (!isNotificationSupported()) {
    return false;
  }

  // Auto enable if permission was granted
  if (Notification.permission === 'granted') {
    try {
      // 1. Try via Service Worker first for maximum mobile reliability
      if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready
          .then((registration) => {
            if (registration && registration.showNotification) {
              return registration.showNotification(title, {
                body,
                icon,
                badge: icon,
                tag,
                data: { url },
                vibrate: [250, 100, 250],
                requireInteraction: false,
              });
            }
            throw new Error('SW showNotification unavailable');
          })
          .catch(() => {
            // Fallback to standard Notification constructor
            createWindowNotification(title, body, icon, tag, url);
          });
        return true;
      }

      // 2. Fallback to standard window Notification
      return createWindowNotification(title, body, icon, tag, url);
    } catch (e) {
      console.warn('Notification error:', e);
      return false;
    }
  }

  return false;
}

function createWindowNotification(title, body, icon, tag, url) {
  try {
    const notif = new Notification(title, {
      body,
      icon,
      badge: icon,
      tag,
      vibrate: [200, 100, 200],
      requireInteraction: false,
    });

    notif.onclick = function (event) {
      event.preventDefault();
      window.focus();
      if (url && typeof window !== 'undefined') {
        window.location.href = url;
      }
      notif.close();
    };
    return true;
  } catch (err) {
    console.warn('Window Notification constructor fallback failed:', err);
    return false;
  }
}

/**
 * Notifikasi instan saat pengguna menginput transaksi baru.
 * Menghitung total pengeluaran hari ini dan menampilkannya di notifikasi HP!
 */
export function notifyTransactionCreated({
  type = 'expense',
  amount = 0,
  categoryName = '',
  existingTransactions = [],
  date = '',
}) {
  const numericAmount = parseFloat(amount) || 0;
  const todayStr = (date || new Date().toISOString()).slice(0, 10);
  const nowToday = new Date().toISOString().slice(0, 10);

  // Mark that user has logged a transaction today
  if (todayStr === nowToday) {
    localStorage.setItem('user_last_tx_date', nowToday);
  }

  // Calculate today's total expenses (all expense transactions on todayStr + new expense if applicable)
  let todayExpenseTotal = existingTransactions
    .filter((t) => {
      const txDate = (t.date || '').slice(0, 10);
      return txDate === todayStr && t.type === 'expense';
    })
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  if (type === 'expense') {
    todayExpenseTotal += numericAmount;
  }

  const formattedAmount = formatRupiah(numericAmount, true);
  const formattedTodayExpense = formatRupiah(todayExpenseTotal, true);

  let title = '';
  let body = '';

  if (type === 'expense') {
    title = `💸 Pengeluaran Tercatat: -${formattedAmount}`;
    body = `Total pengeluaran hari ini: ${formattedTodayExpense}. Kategori: ${categoryName || 'Pengeluaran'}.`;
  } else if (type === 'income') {
    title = `💰 Pemasukan Tercatat: +${formattedAmount}`;
    body = `Total pengeluaran hari ini: ${formattedTodayExpense}. Pemasukan berhasil ditambahkan!`;
  } else {
    title = `⇄ Transfer Tercatat: ${formattedAmount}`;
    body = `Dana berhasil dipindahkan. Total pengeluaran hari ini: ${formattedTodayExpense}.`;
  }

  // Check permission or prompt
  if (getNotificationPermission() === 'default') {
    requestNotificationPermission().then((res) => {
      if (res.success) {
        sendPushNotification({
          title,
          body,
          tag: `tx-${Date.now()}`,
          url: '/transaksi',
        });
      }
    });
    return;
  }

  sendPushNotification({
    title,
    body,
    tag: `tx-${Date.now()}`,
    url: '/transaksi',
  });
}

/**
 * Cek apakah hari ini sudah ada transaksi atau belum.
 * Jika belum ada transaksi sama sekali, kirim pengingat (reminder).
 */
export function checkAndSendDailyReminder(transactions = []) {
  if (typeof window === 'undefined') return;

  const isEnabled = localStorage.getItem('user_mobile_notif_enabled') !== 'false';
  if (!isEnabled || getNotificationPermission() !== 'granted') return;

  const todayStr = new Date().toISOString().slice(0, 10);
  // Fixed reminder hour: 20:00 WIB
  const targetHour = 20;
  const reminderKey = `user_last_reminder_${todayStr}_${targetHour}`;

  // If already reminded today at this hour, don't spam
  if (localStorage.getItem(reminderKey) === 'true') return;

  // Check if user has any transaction today
  const hasTxToday = transactions.some((t) => {
    const txDate = (t.date || '').slice(0, 10);
    return txDate === todayStr;
  });

  const lastTxDate = localStorage.getItem('user_last_tx_date');
  if (hasTxToday || lastTxDate === todayStr) {
    return;
  }

  const currentHour = new Date().getHours();

  // Trigger when currentHour reaches 20:00
  if (currentHour >= targetHour) {
    sendPushNotification({
      title: '⏰ Pengingat: Belum Ada Catatan Hari Ini!',
      body: 'Kamu belum mencatat pengeluaran atau pemasukan hari ini. Yuk catat sekarang agar keuanganmu tetap terkontrol! 📊',
      tag: 'daily-reminder-empty',
      url: '/transaksi',
    });
    localStorage.setItem(reminderKey, 'true');
    localStorage.setItem('user_last_reminder_date', todayStr);
  }
}

// Generate WhatsApp reminder link
export function openWhatsAppReminder(phone = '') {
  const message = encodeURIComponent(
    'Pengingat Money Management: Jangan lupa catat seluruh transaksi pengeluaran & pemasukan Anda hari ini di http://localhost:3000/transaksi! 📊'
  );
  const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${message}`
    : `https://wa.me/?text=${message}`;
  window.open(waUrl, '_blank');
}

// Background scheduler that runs periodically while the web app is open
let schedulerIntervalId = null;

export function initDailyReminderScheduler() {
  if (typeof window === 'undefined') return;
  if (schedulerIntervalId) clearInterval(schedulerIntervalId);

  const checkAndNotify = () => {
    try {
      const isEnabled = localStorage.getItem('user_mobile_notif_enabled') !== 'false';
      if (!isEnabled || getNotificationPermission() !== 'granted') return;

      // Fixed reminder hour: 20:00 WIB (no user config needed)
      const targetHour = 20;
      const now = new Date();
      const currentHour = now.getHours();
      const todayStr = now.toISOString().slice(0, 10);
      const reminderKey = `user_last_reminder_${todayStr}_${targetHour}`;
      const alreadySent = localStorage.getItem(reminderKey) === 'true';
      const lastTxDate = localStorage.getItem('user_last_tx_date');

      if (lastTxDate !== todayStr && currentHour >= targetHour && !alreadySent) {
        sendPushNotification({
          title: '⏰ Pengingat: Belum Ada Catatan Hari Ini!',
          body: 'Kamu belum mencatat pengeluaran atau pemasukan hari ini. Yuk catat sekarang agar keuanganmu tetap terkontrol! 📊',
          tag: 'daily-reminder-empty',
          url: '/transaksi',
        });
        localStorage.setItem(reminderKey, 'true');
        localStorage.setItem('user_last_reminder_date', todayStr);
      }
    } catch (err) {
      console.warn('Scheduler error:', err);
    }
  };

  // Run check on startup and then every 2 minutes
  checkAndNotify();
  schedulerIntervalId = setInterval(checkAndNotify, 120000);
}
