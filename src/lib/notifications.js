// Utility for In-App Notifications & Mobile Lock Screen Push Alerts
import { formatRupiah } from './utils';

export const NOTIF_STORAGE_KEY = 'money_in_app_notifications_v1';

export const DEFAULT_IN_APP_NOTIFICATIONS = [
  {
    id: 'sample-welcome',
    icon: 'notifications_active',
    color: '#2563EB',
    bg: '#EFF6FF',
    title: 'Notifikasi In-App & Layar HP Aktif! 🔔',
    desc: 'Pemberitahuan transaksi, pengingat harian, dan peringatan anggaran sekarang langsung masuk ke tanda lonceng aplikasi & lock screen HP Anda.',
    time: 'Hari ini',
    unread: true,
    timestamp: Date.now(),
    url: '/dasbor',
  },
  {
    id: 'sample-budget',
    icon: 'warning',
    color: '#E11D48',
    bg: '#FDE8E8',
    title: 'Peringatan Anggaran Belanja',
    desc: 'Pengeluaran kategori belanja mendekati batas anggaran bulanan.',
    time: '2 jam lalu',
    unread: true,
    timestamp: Date.now() - 7200000,
    url: '/anggaran',
  },
  {
    id: 'sample-savings',
    icon: 'savings',
    color: '#059669',
    bg: '#ECFDF5',
    title: 'Target Tabungan 80% Tercapai',
    desc: 'Dana darurat hampir mencapai target yang Anda tetapkan.',
    time: '1 hari lalu',
    unread: false,
    timestamp: Date.now() - 86400000,
    url: '/tabungan',
  },
];

/**
 * Get all in-app notifications from localStorage
 */
export function getInAppNotifications() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(NOTIF_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(DEFAULT_IN_APP_NOTIFICATIONS));
      return DEFAULT_IN_APP_NOTIFICATIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_IN_APP_NOTIFICATIONS;
  } catch (e) {
    console.warn('Error reading in-app notifications:', e);
    return DEFAULT_IN_APP_NOTIFICATIONS;
  }
}

/**
 * Save in-app notifications and broadcast event to listeners (e.g. NotificationButton)
 */
export function saveInAppNotifications(notifs) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifs));
    window.dispatchEvent(new CustomEvent('in-app-notification-changed'));
  } catch (e) {
    console.warn('Error saving in-app notifications:', e);
  }
}

/**
 * Add a new notification directly to the in-app bell notification store
 */
export function addInAppNotification({
  title = 'Pemberitahuan Baru',
  desc = '',
  icon = 'notifications',
  color = '#2563EB',
  bg = '#EFF6FF',
  url = '/transaksi',
} = {}) {
  const current = getInAppNotifications();
  const newNotif = {
    id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    icon,
    color,
    bg,
    title,
    desc,
    time: 'Baru saja',
    unread: true,
    timestamp: Date.now(),
    url,
  };
  // Prepend to top and limit to 30 items
  const updated = [newNotif, ...current].slice(0, 30);
  saveInAppNotifications(updated);
  return newNotif;
}

/**
 * Mark a single in-app notification as read
 */
export function markNotificationRead(id) {
  const current = getInAppNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, unread: false } : n));
  saveInAppNotifications(updated);
}

/**
 * Mark all in-app notifications as read
 */
export function markAllNotificationsRead() {
  const current = getInAppNotifications();
  const updated = current.map((n) => ({ ...n, unread: false }));
  saveInAppNotifications(updated);
}

/**
 * Clear all in-app notifications
 */
export function clearAllInAppNotifications() {
  saveInAppNotifications([]);
}

/* =========================================================================
   NATIVE WEB PUSH & MOBILE LOCK SCREEN NOTIFICATIONS
   ========================================================= */

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
      return { success: true, status: 'granted', message: 'Izin notifikasi aktif! Notifikasi siap muncul di lock screen HP.' };
    } else {
      localStorage.setItem('user_mobile_notif_enabled', 'false');
      return {
        success: false,
        status: permission,
        message: 'Izin notifikasi belum diizinkan. Silakan izinkan di pengaturan browser/HP agar muncul di lock screen.',
      };
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return { success: false, status: 'error', message: error.message };
  }
}

/**
 * Send native push notification to device/mobile screen & lock screen
 * Menggunakan PNG raster icon dan renotify agar dapat tampil di Lock Screen Android & iOS PWA.
 */
export async function sendPushNotification({
  title = '⏰ Money Management',
  body = 'Catatan keuangan baru berhasil disimpan.',
  icon = '/icon-192.png',
  badge = '/icon-192.png',
  tag = '',
  url = '/transaksi',
} = {}) {
  if (!isNotificationSupported()) {
    return false;
  }

  // Auto request permission if status is default
  let perm = Notification.permission;
  if (perm === 'default') {
    const res = await requestNotificationPermission();
    perm = res.status;
  }

  if (perm !== 'granted') {
    return false;
  }

  const notificationTag = tag || `money-${Date.now()}`;
  const notifOptions = {
    body,
    icon,
    badge,
    tag: notificationTag,
    renotify: true,
    vibrate: [300, 150, 300],
    data: { url },
    requireInteraction: false,
    silent: false,
  };

  // 1. Try via Service Worker (Wajib untuk Lock Screen & Status Bar Android / iOS PWA)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, notifOptions);
        return true;
      }
    } catch (e) {
      console.warn('SW showNotification error, trying fallback:', e);
    }
  }

  // 2. Fallback to standard window Notification constructor
  return createWindowNotification(title, body, icon, notificationTag, url);
}

function createWindowNotification(title, body, icon, tag, url) {
  try {
    const notif = new Notification(title, {
      body,
      icon,
      badge: icon,
      tag,
      vibrate: [300, 150, 300],
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
 * Uji coba notifikasi khusus untuk Lock Screen (Layar Terkunci HP).
 * Memberikan jeda waktu hitung mundur agar pengguna sempat mengunci layar HP mereka
 * untuk melihat notifikasi muncul langsung di lock screen!
 */
export function scheduleLockScreenTestNotification(delaySeconds = 3, onCountdown) {
  let remaining = delaySeconds;
  if (onCountdown) onCountdown(remaining);

  const intervalId = setInterval(() => {
    remaining -= 1;
    if (remaining > 0) {
      if (onCountdown) onCountdown(remaining);
    } else {
      clearInterval(intervalId);
      if (onCountdown) onCountdown(0);
      sendPushNotification({
        title: '🔒 Money Management (Lock Screen)',
        body: 'Notifikasi berhasil muncul di layar HP Anda! Catat keuanganmu tepat waktu 📊',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: `lockscreen-${Date.now()}`,
        url: '/transaksi',
      });
    }
  }, 1000);

  return () => clearInterval(intervalId);
}

/**
 * Notifikasi instan saat pengguna menginput transaksi baru.
 * Otomatis menambahkan pemberitahuan ke lonceng aplikasi & mengirim Web Push ke Lock Screen!
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
  let icon = 'payments';
  let color = '#E11D48';
  let bg = '#FEE2E2';

  if (type === 'expense') {
    title = `💸 Pengeluaran: -${formattedAmount}`;
    body = `Total hari ini: ${formattedTodayExpense}. Kategori: ${categoryName || 'Pengeluaran'}.`;
    icon = 'shopping_bag';
    color = '#E11D48';
    bg = '#FDE8E8';
  } else if (type === 'income') {
    title = `💰 Pemasukan: +${formattedAmount}`;
    body = `Total pengeluaran hari ini: ${formattedTodayExpense}. Pemasukan berhasil ditambahkan!`;
    icon = 'account_balance_wallet';
    color = '#059669';
    bg = '#ECFDF5';
  } else {
    title = `⇄ Transfer: ${formattedAmount}`;
    body = `Dana berhasil dipindahkan. Total hari ini: ${formattedTodayExpense}.`;
    icon = 'sync_alt';
    color = '#2563EB';
    bg = '#EFF6FF';
  }

  // 1. TAMBAHKAN KE PUSAT NOTIFIKASI LONCENG APLIKASI
  addInAppNotification({
    title,
    desc: body,
    icon,
    color,
    bg,
    url: '/transaksi',
  });

  // 2. KIRIM KE STATUS BAR & LOCK SCREEN HP
  sendPushNotification({
    title,
    body,
    tag: `tx-${Date.now()}`,
    url: '/transaksi',
  });
}

/**
 * Cek apakah hari ini sudah ada transaksi atau belum.
 * Jika belum ada transaksi sama sekali pada pukul 20:00 WIB, kirim pengingat ke lonceng & lock screen.
 */
export function checkAndSendDailyReminder(transactions = []) {
  if (typeof window === 'undefined') return;

  const isEnabled = localStorage.getItem('user_mobile_notif_enabled') !== 'false';
  if (!isEnabled) return;

  const todayStr = new Date().toISOString().slice(0, 10);
  const targetHour = 20;
  const reminderKey = `user_last_reminder_${todayStr}_${targetHour}`;

  // If already reminded today at this hour, don't repeat
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
    const reminderTitle = '⏰ Pengingat: Belum Ada Catatan Hari Ini!';
    const reminderDesc = 'Kamu belum mencatat pengeluaran atau pemasukan hari ini. Yuk catat sekarang agar keuanganmu tetap terkontrol! 📊';

    // Tambahkan ke lonceng in-app
    addInAppNotification({
      title: reminderTitle,
      desc: reminderDesc,
      icon: 'alarm',
      color: '#D97706',
      bg: '#FEF3C7',
      url: '/transaksi',
    });

    // Kirim push ke status bar & lock screen
    sendPushNotification({
      title: reminderTitle,
      body: reminderDesc,
      tag: 'daily-reminder-empty',
      url: '/transaksi',
    });

    localStorage.setItem(reminderKey, 'true');
    localStorage.setItem('user_last_reminder_date', todayStr);
  }
}

// Background scheduler that runs periodically while the web app is open
let schedulerIntervalId = null;

export function initDailyReminderScheduler() {
  if (typeof window === 'undefined') return;
  if (schedulerIntervalId) clearInterval(schedulerIntervalId);

  const checkAndNotify = () => {
    try {
      const isEnabled = localStorage.getItem('user_mobile_notif_enabled') !== 'false';
      if (!isEnabled) return;

      const targetHour = 20;
      const now = new Date();
      const currentHour = now.getHours();
      const todayStr = now.toISOString().slice(0, 10);
      const reminderKey = `user_last_reminder_${todayStr}_${targetHour}`;
      const alreadySent = localStorage.getItem(reminderKey) === 'true';
      const lastTxDate = localStorage.getItem('user_last_tx_date');

      if (lastTxDate !== todayStr && currentHour >= targetHour && !alreadySent) {
        const reminderTitle = '⏰ Pengingat: Belum Ada Catatan Hari Ini!';
        const reminderDesc = 'Kamu belum mencatat pengeluaran atau pemasukan hari ini. Yuk catat sekarang agar keuanganmu tetap terkontrol! 📊';

        addInAppNotification({
          title: reminderTitle,
          desc: reminderDesc,
          icon: 'alarm',
          color: '#D97706',
          bg: '#FEF3C7',
          url: '/transaksi',
        });

        sendPushNotification({
          title: reminderTitle,
          body: reminderDesc,
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
