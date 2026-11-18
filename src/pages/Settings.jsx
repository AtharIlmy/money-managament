import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePWA } from '../context/PWAContext';
import { useTheme } from '../context/ThemeContext';
import NotificationButton from '../components/NotificationButton';
import ThemeToggleBtn from '../components/ThemeToggleBtn';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendPushNotification,
  addInAppNotification,
  scheduleLockScreenTestNotification,
} from '../lib/notifications';
import {
  User,
  Sliders,
  Lock,
  Bell,
  Download,
  Smartphone,
  Check,
  AlertCircle,
  Shield,
  LogOut,
  Moon,
  Sun,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  Database,
  FileSpreadsheet,
  Mail,
} from 'lucide-react';

export default function Settings() {
  const { user, updateUser, authFetch, logout } = useAuth();
  const navigate = useNavigate();
  const { openInstallModal, isInstalled, deferredPrompt, installApp } = usePWA();
  const { isDark, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');

  // Profile form state
  const [profileForm, setProfileForm] = useState(() => ({
    name: user?.name || '',
    email: user?.email || '',
    currency: 'IDR',
  }));
  const [prevUserId, setPrevUserId] = useState(user?.id);
  if (user && user.id !== prevUserId) {
    setPrevUserId(user.id);
    setProfileForm((prev) => ({
      ...prev,
      name: user.name || '',
      email: user.email || '',
    }));
  }
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  // Preferences state
  const [preferences, setPreferences] = useState(() => {
    const defaults = {
      budgetCycleDay: '1',
      dateFormat: 'DD/MM/YYYY',
      hideBalanceDashboard: false,
      defaultTxType: 'expense',
      rounding: 'none',
    };
    try {
      const saved = localStorage.getItem('user_finance_preferences');
      const parsed = saved ? JSON.parse(saved) : {};
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? { ...defaults, ...parsed }
        : defaults;
    } catch {
      return defaults;
    }
  });
  const [prefSaved, setPrefSaved] = useState(false);

  // Notification toggles
  const [notifSettings, setNotifSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('user_notification_settings');
      return saved
        ? JSON.parse(saved)
        : {
          billDueReminder: true,
          budgetOverrunAlert: true,
          weeklyDigest: false,
          savingsMilestoneAlert: true,
        };
    } catch {
      return {
        billDueReminder: true,
        budgetOverrunAlert: true,
        weeklyDigest: false,
        savingsMilestoneAlert: true,
      };
    }
  });
  const [notifSaved, setNotifSaved] = useState(false);
  const [notifSaving, setNotifSaving] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState(() => {
    if (typeof window !== 'undefined') {
      return getNotificationPermission();
    }
    return 'default';
  });
  const [reminderHour, setReminderHour] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('user_reminder_hour') || '20';
    }
    return '20';
  });
  const [notifFeedback, setNotifFeedback] = useState('');
  const [lockCountdown, setLockCountdown] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  // Initialize reminder setting in localStorage if not set
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedHour = localStorage.getItem('user_reminder_hour');
      if (!savedHour) {
        localStorage.setItem('user_reminder_hour', '20');
      }
    }
  }, []);

  const handleEnablePermission = async () => {
    const res = await requestNotificationPermission();
    setPermissionStatus(getNotificationPermission());
    setNotifFeedback(res.message);
    if (res.success) {
      sendPushNotification({
        title: '🎉 Notifikasi Pengingat Layar Aktif',
        body: 'Money Management akan mengingatkan Anda untuk mencatat transaksi tepat waktu!',
      });
    }
    setTimeout(() => setNotifFeedback(''), 4500);
  };

  const handleTestPush = () => {
    const sent = sendPushNotification({
      title: '⏰ Pengingat Catat Keuangan',
      body: 'Sudah catat pemasukan atau pengeluaran hari ini? Yuk luangkan 1 menit sekarang!',
      url: '/transaksi',
    });
    if (sent) {
      setNotifFeedback('Notifikasi pengingat berhasil dikirim ke layar HP / Browser Anda!');
    } else {
      handleEnablePermission();
    }
    setTimeout(() => setNotifFeedback(''), 4500);
  };

  const handleTestInApp = () => {
    addInAppNotification({
      title: '🔔 Uji Coba Notifikasi In-App',
      desc: 'Notifikasi berhasil terkirim langsung ke tanda lonceng aplikasi!',
      icon: 'notifications_active',
      color: '#2563EB',
      bg: '#EFF6FF',
      url: '/dasbor',
    });
    setNotifFeedback('Notifikasi tes berhasil masuk ke ikon lonceng di atas!');
    setTimeout(() => setNotifFeedback(''), 4500);
  };

  const handleTestLockScreen = async () => {
    if (permissionStatus !== 'granted') {
      const res = await requestNotificationPermission();
      setPermissionStatus(getNotificationPermission());
      if (!res.success) {
        setNotifFeedback('Mohon izinkan notifikasi terlebih dahulu agar dapat muncul di lock screen.');
        setTimeout(() => setNotifFeedback(''), 4500);
        return;
      }
    }

    setNotifFeedback('🔒 Kunci layar HP Anda sekarang! Notifikasi akan muncul dalam 4 detik...');
    scheduleLockScreenTestNotification(4, (seconds) => {
      setLockCountdown(seconds);
      if (seconds === 0) {
        setLockCountdown(null);
        setNotifFeedback('✓ Notifikasi telah dikirim ke Lock Screen HP!');
        setTimeout(() => setNotifFeedback(''), 5000);
      }
    });
  };

  // Profile Update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMessage({ type: '', text: '' });
    setProfileLoading(true);

    try {
      if (authFetch) {
        const res = await authFetch('/api/auth/profile', {
          method: 'PUT',
          body: JSON.stringify({
            name: profileForm.name.trim(),
            email: profileForm.email.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal memperbarui profil');
        updateUser(data.user);
      } else {
        updateUser({ ...user, name: profileForm.name.trim(), email: profileForm.email.trim() });
      }

      setProfileMessage({
        type: 'success',
        text: 'Profil berhasil diperbarui dengan aman!',
      });
      setTimeout(() => setProfileMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      setProfileMessage({ type: 'error', text: err.message });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/masuk', { replace: true });
  };

  // Password Update
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({
        type: 'error',
        text: 'Konfirmasi kata sandi baru tidak cocok',
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage({
        type: 'error',
        text: 'Kata sandi baru minimal harus 6 karakter',
      });
      return;
    }

    setPasswordLoading(true);
    try {
      if (authFetch) {
        const res = await authFetch('/api/auth/password', {
          method: 'PUT',
          body: JSON.stringify({
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal memperbarui kata sandi');
      }

      setPasswordMessage({
        type: 'success',
        text: 'Kata sandi berhasil diubah! Gunakan kata sandi baru saat login.',
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err.message });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Save Preferences
  const handleSavePreferences = () => {
    localStorage.setItem('user_finance_preferences', JSON.stringify(preferences));
    setPrefSaved(true);
    setTimeout(() => setPrefSaved(false), 3000);
  };

  // Save Notifications
  const handleSaveNotifs = async () => {
    setNotifSaving(true);
    try {
      localStorage.setItem('user_notification_settings', JSON.stringify(notifSettings));
      setNotifSaved(true);
      setNotifFeedback('Pengaturan notifikasi berhasil diperbarui!');
    } catch (err) {
      console.error('Error saving notification settings:', err);
    } finally {
      setNotifSaving(false);
      setTimeout(() => {
        setNotifSaved(false);
        setNotifFeedback('');
      }, 4000);
    }
  };

  // Export CSV Data
  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      if (authFetch) {
        const res = await authFetch('/api/transactions');
        if (!res.ok) throw new Error('Gagal mengunduh data transaksi');
        const data = await res.json();
        const transactions = Array.isArray(data) ? data : data.transactions || [];

        if (transactions.length === 0) {
          alert('Belum ada transaksi untuk diekspor.');
          setExportLoading(false);
          return;
        }

        const headers = ['ID', 'Tanggal', 'Deskripsi', 'Kategori', 'Tipe', 'Nominal (IDR)', 'Dompet'];
        const rows = transactions.map((t) => [
          t.id,
          t.date || t.created_at,
          `"${(t.description || '').replace(/"/g, '""')}"`,
          `"${t.category_name || '-'}"`,
          t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
          t.amount,
          `"${t.wallet_name || '-'}"`,
        ]);

        const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `data_transaksi_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setExportLoading(false);
    }
  };

  const userName = user?.name || 'Muhammad Aisyar';
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const TABS = [
    { id: 'profile', label: 'Profil Pengguna', icon: User },
    { id: 'preferences', label: 'Preferensi Keuangan', icon: Sliders },
    { id: 'security', label: 'Keamanan & Sandi', icon: Lock },
    { id: 'notifications', label: 'Notifikasi', icon: Bell },
    { id: 'data', label: 'Cadangan & Data', icon: Database },
    { id: 'app', label: 'Unduh Aplikasi', icon: Smartphone },
  ];

  return (
    <div className="w-full min-h-screen bg-[#F2F3F8] dark:bg-[#0d0f18] text-[#191B3D] dark:text-slate-100 font-sans antialiased transition-colors duration-150 flex flex-col">
      {/* Feedback Toast */}
      {notifFeedback && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-[#191B3D] dark:bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold animate-fade-in max-w-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notifFeedback}</span>
        </div>
      )}

      {/* ======================================================================= */}
      {/* TOPBAR (DESKTOP / TABLET: md+)                                          */}
      {/* ======================================================================= */}
      <header className="hidden md:flex items-center justify-between px-6 lg:px-8 h-[68px] bg-white dark:bg-[#141721] border-b border-[#DFE5EE] dark:border-gray-800 sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-2 text-xs text-[#7F8A9E] dark:text-slate-400">
          <span>Ruang personal</span>
          <span>·</span>
          <span className="font-semibold text-[#191B3D] dark:text-white">Pengaturan</span>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#22755F] dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-[#22755F] dark:bg-emerald-400 inline-block animate-pulse" />
            Data tersimpan
          </div>
          <ThemeToggleBtn />
          <NotificationButton />
          <span className="text-xs text-[#191B3D] dark:text-slate-300 font-medium">
            {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
          </span>
        </div>
      </header>

      {/* ======================================================================= */}
      {/* CONTENT CONTAINER                                                       */}
      {/* ======================================================================= */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-5 md:pt-7 pb-24 md:pb-12 max-w-7xl w-full mx-auto space-y-6">
        {/* Mobile Subheader Breadcrumb & Date */}
        <div className="md:hidden flex items-center justify-between text-[11px] text-[#61647C] dark:text-slate-400 px-0.5">
          <span>Ruang personal · Pengaturan</span>
          <span>
            {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date())}
          </span>
        </div>

        {/* ===================================================================== */}
        {/* ROW 1: HEADER & PROFILE HERO BANNER                                   */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Banner: Info Pengaturan (span 7 or 8) */}
          <div className="lg:col-span-8 bg-gradient-to-br from-[#ECEEF8] via-[#E6E9F5] to-[#DFE3F2] dark:from-[#181B30] dark:via-[#15172A] dark:to-[#101222] border border-[#D4DAEB] dark:border-indigo-950/60 rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-xs space-y-4 relative overflow-hidden">
            {/* Subtle light mesh accent */}
            <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-indigo-400/10 dark:bg-indigo-500/10 blur-3xl" aria-hidden="true" />

            <div className="space-y-2 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-indigo-600/10 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300 border border-indigo-600/15">
                <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                <span>Pusat Konfigurasi &amp; Preferensi</span>
              </div>
              <h1 className="text-xl md:text-2xl font-extrabold text-[#191B3D] dark:text-white tracking-tight">
                Pengaturan Akun &amp; Sistem
              </h1>
              <p className="text-xs md:text-sm text-[#61647C] dark:text-slate-300 leading-relaxed max-w-xl">
                Sesuaikan profil identitas, preferensi keuangan, keamanan kata sandi, dan sinkronisasi notifikasi perangkat Anda.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap pt-2 text-xs relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-gray-800/90 border border-indigo-100/90 dark:border-gray-700 font-semibold text-[#191B3D] dark:text-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
                <Shield className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Akun Terverifikasi</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-gray-800/90 border border-indigo-100/90 dark:border-gray-700 font-semibold text-[#191B3D] dark:text-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Pengingat: {reminderHour}:00 WIB</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-gray-800/90 border border-indigo-100/90 dark:border-gray-700 font-semibold text-emerald-700 dark:text-emerald-400 shadow-2xs hover:shadow-xs transition-shadow">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>PWA v1.4.0 Aktif</span>
              </span>
            </div>
          </div>

          {/* Right Profile Card (span 4 or 5) */}
          <div className="lg:col-span-4 bg-gradient-to-br from-[#16193F] via-[#1B1E48] to-[#10122B] rounded-2xl p-6 sm:p-7 text-white flex flex-col justify-between shadow-lg relative overflow-hidden min-h-[165px] border border-indigo-900/50">
            {/* Glow accent */}
            <div
              className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full bg-indigo-500/25 blur-3xl"
              aria-hidden="true"
            />

            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-indigo-200/80 uppercase">
                PROFIL PENGGUNA
              </span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold uppercase tracking-wide border border-indigo-400/20">
                Personal Pro
              </span>
            </div>

            <div className="flex items-center gap-3.5 my-3 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-extrabold text-base flex items-center justify-center shrink-0 shadow-md ring-2 ring-white/20">
                {initials}
              </div>
              <div className="truncate">
                <h3 className="font-extrabold text-base text-white truncate leading-tight">
                  {userName}
                </h3>
                <p className="text-xs text-indigo-200/80 truncate mt-0.5">
                  {user?.email || 'aisyar@example.com'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-indigo-200/90 pt-3 border-t border-white/10 relative z-10">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                Personal Aktif
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-rose-300 hover:text-white hover:bg-rose-500/20 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition-all border border-rose-400/20"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* ROW 2: 4 SUMMARY OVERVIEW CARDS (Responsive Grid)                     */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Akun Pengguna */}
          <div className="bg-white dark:bg-[#141721] border border-[#DFE5EE] dark:border-gray-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow min-h-[125px]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-[#7F8A9E] dark:text-slate-400 uppercase">
                AKUN PENGGUNA
              </span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <User className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-extrabold text-[#191B3D] dark:text-white truncate my-1.5">
              {userName}
            </div>
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Akun Personal Aktif
              </span>
            </div>
          </div>

          {/* Card 2: Tema Tampilan */}
          <div className="bg-white dark:bg-[#141721] border border-[#DFE5EE] dark:border-gray-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow min-h-[125px]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-[#7F8A9E] dark:text-slate-400 uppercase">
                TEMA TAMPILAN
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                {isDark ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
              </div>
            </div>
            <div className="text-base font-extrabold text-[#191B3D] dark:text-white my-1.5">
              {isDark ? 'Mode Gelap' : 'Mode Terang'}
            </div>
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                Sinkronisasi Sistem
              </span>
            </div>
          </div>

          {/* Card 3: Status Notifikasi */}
          <div className="bg-white dark:bg-[#141721] border border-[#DFE5EE] dark:border-gray-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow min-h-[125px]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-[#7F8A9E] dark:text-slate-400 uppercase">
                STATUS NOTIFIKASI
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Bell className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-extrabold text-[#191B3D] dark:text-white my-1.5">
              {permissionStatus === 'granted' ? 'Aktif (Push Web)' : 'Belum Diizinkan'}
            </div>
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
                Pengingat jam {reminderHour}:00
              </span>
            </div>
          </div>

          {/* Card 4: Versi Aplikasi */}
          <div className="bg-white dark:bg-[#141721] border border-[#DFE5EE] dark:border-gray-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow min-h-[125px]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-[#7F8A9E] dark:text-slate-400 uppercase">
                VERSI APLIKASI
              </span>
              <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Smartphone className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-extrabold text-[#191B3D] dark:text-white my-1.5">
              PWA v1.4.0
            </div>
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40">
                Tersinkronisasi Lokal
              </span>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* ROW 3: TAB NAVIGATION & CONTENT (2 Kolom di Desktop / Stacked)        */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* TAB LIST: Desktop Left Nav (4 Kolom) / Mobile Horizontal Pills */}
          <aside className="lg:col-span-4 bg-white dark:bg-[#141721] border border-[#DFE5EE] dark:border-gray-800 rounded-2xl p-4 sm:p-5.5 shadow-2xs">
            <div className="hidden lg:flex items-center justify-between px-3 py-2 mb-2">
              <span className="text-[11px] font-bold text-[#7F8A9E] dark:text-slate-400 uppercase tracking-wider">
                MENU PENGATURAN
              </span>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                6 Kategori
              </span>
            </div>

            {/* Mobile / Tablet Horizontal Scrollable Pills */}
            <div className="flex lg:flex-col gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              {TABS.map((tab) => {
                const IconComp = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer text-left w-full ${isActive
                        ? 'bg-gradient-to-r from-[#17193F] to-[#25285E] dark:from-indigo-600 dark:to-indigo-700 text-white shadow-md border-l-4 border-indigo-400 pl-3.5'
                        : 'text-[#61647C] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800/60 hover:text-[#191B3D] dark:hover:text-white'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isActive
                          ? 'bg-white/15 text-white'
                          : 'bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-slate-400'
                        }`}>
                        <IconComp className="w-3.5 h-3.5 shrink-0" />
                      </div>
                      <span>{tab.label}</span>
                    </div>
                    <ChevronRight className={`hidden lg:block w-3.5 h-3.5 transition-transform ${isActive ? 'opacity-100 translate-x-0.5 text-indigo-300' : 'opacity-30'}`} />
                  </button>
                );
              })}
            </div>

            {/* Logout shortcut in sidebar on desktop */}
            <div className="hidden lg:block pt-3 mt-4 border-t border-slate-100 dark:border-gray-800">
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 w-full transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <LogOut className="w-3.5 h-3.5" />
                  </div>
                  <span>Keluar dari Akun</span>
                </div>
                <span className="text-[10px] text-rose-400/80 group-hover:text-rose-600 transition-colors">Sesi Aktif</span>
              </button>
            </div>
          </aside>

          {/* TAB CONTENT: Right Main Panel (8 Kolom) */}
          <section className="lg:col-span-8 bg-white dark:bg-[#141721] border border-[#DFE5EE] dark:border-gray-800 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
            {/* ----------------------------------------------------------------- */}
            {/* TAB 1: PROFIL PENGGUNA                                            */}
            {/* ----------------------------------------------------------------- */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-gray-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-extrabold text-[#191B3D] dark:text-white">
                        Profil Pengguna
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40">
                        Akun Utama
                      </span>
                    </div>
                    <p className="text-xs text-[#7F8A9E] dark:text-slate-400 mt-0.5">
                      Perbarui nama dan alamat email yang terhubung dengan akun Anda
                    </p>
                  </div>
                </div>

                {/* Avatar Mini Card preview */}
                <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-gray-900/60 border border-[#E2E8F0] dark:border-gray-800 flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 text-white font-extrabold text-lg flex items-center justify-center shrink-0 shadow-md ring-2 ring-indigo-200/60 dark:ring-indigo-900/60">
                      {initials}
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-[#191B3D] dark:text-white flex items-center gap-1.5">
                        <span>{userName}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {user?.email || 'aisyar@example.com'}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                        Personal Pro Member · Sejak 2026
                      </span>
                    </div>
                  </div>
                </div>

                {profileMessage.text && (
                  <div
                    className={`flex items-center gap-2 p-3.5 rounded-xl text-xs font-semibold ${profileMessage.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900'
                        : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900'
                      }`}
                  >
                    {profileMessage.type === 'success' ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                    <span>{profileMessage.text}</span>
                  </div>
                )}

                <form onSubmit={handleProfileSubmit} className="space-y-5 text-xs">
                  <div>
                    <label className="block font-bold text-[#475569] dark:text-slate-300 mb-1.5">
                      Nama Lengkap
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
                        required
                        placeholder="Nama lengkap Anda"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50/70 dark:bg-gray-900 border border-[#D5DCE8] dark:border-gray-700 text-[#191B3D] dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-all shadow-2xs"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                      Nama ini ditampilkan pada dasbor, laporan rekap, dan kuitansi transaksi.
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-[#475569] dark:text-slate-300 mb-1.5">
                      Alamat Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
                        required
                        placeholder="email@anda.com"
                        className="w-full pl-10 pr-28 py-3 rounded-xl bg-slate-50/70 dark:bg-gray-900 border border-[#D5DCE8] dark:border-gray-700 text-[#191B3D] dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-all shadow-2xs"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        Terverifikasi
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                      Digunakan untuk login, pemulihan akun, dan pengiriman ringkasan mingguan.
                    </p>
                  </div>

                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-gray-800">
                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-[#17193F] to-[#25285E] hover:from-[#1F2250] hover:to-[#2D3070] dark:from-indigo-600 dark:to-indigo-700 dark:hover:from-indigo-500 dark:hover:to-indigo-600 text-white shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{profileLoading ? 'Menyimpan...' : 'Simpan Profil'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ----------------------------------------------------------------- */}
            {/* TAB 2: PREFERENSI KEUANGAN                                        */}
            {/* ----------------------------------------------------------------- */}
            {activeTab === 'preferences' && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h2 className="text-base font-extrabold text-[#191B3D] dark:text-white">
                    Preferensi Keuangan
                  </h2>
                  <p className="text-xs text-[#7F8A9E] dark:text-slate-400">
                    Atur kebiasaan pembukuan, format tanggal, dan tampilan nominal
                  </p>
                </div>

                {prefSaved && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 text-xs font-semibold">
                    <Check className="w-4 h-4" />
                    <span>Preferensi berhasil disimpan!</span>
                  </div>
                )}

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-[#475569] dark:text-slate-300 mb-1">
                      Tanggal Mulai Siklus Anggaran Bulanan
                    </label>
                    <select
                      value={preferences.budgetCycleDay}
                      onChange={(e) => setPreferences((p) => ({ ...p, budgetCycleDay: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-gray-900 border border-[#DFE5EE] dark:border-gray-700 text-[#191B3D] dark:text-white outline-none"
                    >
                      {[1, 5, 10, 15, 20, 25, 28].map((day) => (
                        <option key={day} value={String(day)}>
                          Tanggal {day} setiap bulan (Gajian / Awal Periode)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#475569] dark:text-slate-300 mb-1">
                      Format Tanggal
                    </label>
                    <select
                      value={preferences.dateFormat}
                      onChange={(e) => setPreferences((p) => ({ ...p, dateFormat: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-gray-900 border border-[#DFE5EE] dark:border-gray-700 text-[#191B3D] dark:text-white outline-none"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY (Contoh: 17/11/2026)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (Standar Internasional: 2026-11-17)</option>
                    </select>
                  </div>

                  {/* Toggle: Sembunyikan saldo dasbor */}
                  <div className="p-3.5 rounded-xl border border-[#DFE5EE] dark:border-gray-800 bg-slate-50/60 dark:bg-gray-800/30 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[#191B3D] dark:text-white">
                        Sembunyikan Saldo Utama di Dasbor
                      </div>
                      <div className="text-[11px] text-[#7F8A9E] dark:text-slate-400 mt-0.5">
                        Tampilkan sensor &quot;••••••&quot; secara bawaan saat membuka aplikasi
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={preferences.hideBalanceDashboard}
                        onChange={(e) =>
                          setPreferences((p) => ({ ...p, hideBalanceDashboard: e.target.checked }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-[44px] h-[24px] bg-slate-200 dark:bg-gray-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500/30 peer-checked:bg-indigo-600 dark:peer-checked:bg-indigo-500 transition-colors duration-200 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-[18px] after:w-[18px] after:shadow-sm after:transition-all after:duration-200 peer-checked:after:translate-x-[20px]" />
                    </label>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSavePreferences}
                      className="px-5 py-2.5 rounded-xl font-bold bg-[#191B3D] hover:bg-[#252856] dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white shadow-sm transition-all cursor-pointer"
                    >
                      Simpan Preferensi
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------------- */}
            {/* TAB 3: KEAMANAN & SANDI                                          */}
            {/* ----------------------------------------------------------------- */}
            {activeTab === 'security' && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h2 className="text-base font-extrabold text-[#191B3D] dark:text-white">
                    Keamanan &amp; Kata Sandi
                  </h2>
                  <p className="text-xs text-[#7F8A9E] dark:text-slate-400">
                    Ubah kata sandi akun untuk perlindungan privasi finansial maksimal
                  </p>
                </div>

                {passwordMessage.text && (
                  <div
                    className={`flex items-center gap-2 p-3 rounded-xl text-xs font-semibold ${passwordMessage.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300'
                      }`}
                  >
                    {passwordMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{passwordMessage.text}</span>
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-[#475569] dark:text-slate-300 mb-1">
                      Kata Sandi Saat Ini
                    </label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))
                      }
                      required
                      placeholder="Masukkan kata sandi lama"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-gray-900 border border-[#DFE5EE] dark:border-gray-700 text-[#191B3D] dark:text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#475569] dark:text-slate-300 mb-1">
                      Kata Sandi Baru (Min. 6 Karakter)
                    </label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))
                      }
                      required
                      placeholder="Masukkan kata sandi baru"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-gray-900 border border-[#DFE5EE] dark:border-gray-700 text-[#191B3D] dark:text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#475569] dark:text-slate-300 mb-1">
                      Ulangi Kata Sandi Baru
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))
                      }
                      required
                      placeholder="Konfirmasi kata sandi baru"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-gray-900 border border-[#DFE5EE] dark:border-gray-700 text-[#191B3D] dark:text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="px-5 py-2.5 rounded-xl font-bold bg-[#191B3D] hover:bg-[#252856] dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      {passwordLoading ? 'Memperbarui...' : 'Perbarui Kata Sandi'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ----------------------------------------------------------------- */}
            {/* TAB 4: NOTIFIKASI & PENGINGAT                                     */}
            {/* ----------------------------------------------------------------- */}
            {activeTab === 'notifications' && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h2 className="text-base font-extrabold text-[#191B3D] dark:text-white">
                    Notifikasi &amp; Pengingat Harian
                  </h2>
                  <p className="text-xs text-[#7F8A9E] dark:text-slate-400">
                    Atur pengingat catat transaksi otomatis agar pembukuan Anda selalu rapi
                  </p>
                </div>

                {/* Permission Card */}
                <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-extrabold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-indigo-600" />
                      <span>Status Izin Notifikasi Layar: {permissionStatus.toUpperCase()}</span>
                    </div>
                    <p className="text-[#64748B] dark:text-slate-400 mt-1">
                      {permissionStatus === 'granted'
                        ? 'Notifikasi aktif dan dapat mengirim pengingat ke layar HP / Browser.'
                        : 'Izinkan notifikasi agar aplikasi dapat mengirim pengingat tepat waktu.'}
                    </p>
                  </div>

                  {permissionStatus !== 'granted' && (
                    <button
                      type="button"
                      onClick={handleEnablePermission}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer whitespace-nowrap"
                    >
                      Aktifkan Izin
                    </button>
                  )}
                </div>

                {/* Test buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                  <button
                    type="button"
                    onClick={handleTestPush}
                    className="p-3 rounded-xl border border-[#DFE5EE] dark:border-gray-800 bg-slate-50 dark:bg-gray-800/40 hover:bg-slate-100 font-semibold text-[#191B3D] dark:text-white transition-all cursor-pointer text-center"
                  >
                    Uji Notifikasi Layar
                  </button>

                  <button
                    type="button"
                    onClick={handleTestLockScreen}
                    className="p-3 rounded-xl border border-[#DFE5EE] dark:border-gray-800 bg-slate-50 dark:bg-gray-800/40 hover:bg-slate-100 font-semibold text-[#191B3D] dark:text-white transition-all cursor-pointer text-center"
                  >
                    {lockCountdown !== null ? `Kunci Layar (${lockCountdown}s)` : 'Uji Lock Screen HP'}
                  </button>

                  <button
                    type="button"
                    onClick={handleTestInApp}
                    className="p-3 rounded-xl border border-[#DFE5EE] dark:border-gray-800 bg-slate-50 dark:bg-gray-800/40 hover:bg-slate-100 font-semibold text-[#191B3D] dark:text-white transition-all cursor-pointer text-center"
                  >
                    Uji Lonceng In-App
                  </button>
                </div>

                {/* Toggles */}
                <div className="space-y-3 pt-2 text-xs">
                  <div className="p-3.5 rounded-xl border border-[#DFE5EE] dark:border-gray-800 bg-slate-50/60 dark:bg-gray-800/20 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[#191B3D] dark:text-white">
                        Pengingat Tagihan Rutin Jatuh Tempo
                      </div>
                      <div className="text-[11px] text-[#7F8A9E] dark:text-slate-400">
                        Peringatkan 2 hari sebelum tanggal pembayaran tagihan
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={notifSettings.billDueReminder}
                        onChange={(e) =>
                          setNotifSettings((n) => ({ ...n, billDueReminder: e.target.checked }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-[44px] h-[24px] bg-slate-200 dark:bg-gray-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500/30 peer-checked:bg-indigo-600 dark:peer-checked:bg-indigo-500 transition-colors duration-200 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-[18px] after:w-[18px] after:shadow-sm after:transition-all after:duration-200 peer-checked:after:translate-x-[20px]" />
                    </label>
                  </div>

                  <div className="p-3.5 rounded-xl border border-[#DFE5EE] dark:border-gray-800 bg-slate-50/60 dark:bg-gray-800/20 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[#191B3D] dark:text-white">
                        Peringatan Anggaran Kategori Melebihi Batas
                      </div>
                      <div className="text-[11px] text-[#7F8A9E] dark:text-slate-400">
                        Beri notifikasi instan saat pengeluaran melampaui pagu anggaran
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={notifSettings.budgetOverrunAlert}
                        onChange={(e) =>
                          setNotifSettings((n) => ({ ...n, budgetOverrunAlert: e.target.checked }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-[44px] h-[24px] bg-slate-200 dark:bg-gray-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500/30 peer-checked:bg-indigo-600 dark:peer-checked:bg-indigo-500 transition-colors duration-200 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-[18px] after:w-[18px] after:shadow-sm after:transition-all after:duration-200 peer-checked:after:translate-x-[20px]" />
                    </label>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      disabled={notifSaving}
                      onClick={handleSaveNotifs}
                      className="px-5 py-2.5 rounded-xl font-bold bg-[#191B3D] hover:bg-[#252856] dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      {notifSaving ? 'Menyimpan...' : 'Simpan Notifikasi'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------------- */}
            {/* TAB 5: CADANGAN & DATA                                            */}
            {/* ----------------------------------------------------------------- */}
            {activeTab === 'data' && (
              <div className="space-y-5 animate-fade-in text-xs">
                <div>
                  <h2 className="text-base font-extrabold text-[#191B3D] dark:text-white">
                    Cadangan &amp; Ekspor Data
                  </h2>
                  <p className="text-xs text-[#7F8A9E] dark:text-slate-400">
                    Unduh riwayat transaksi keuangan Anda ke format spreadsheet (CSV)
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[#DFE5EE] dark:border-gray-800 bg-slate-50/60 dark:bg-gray-800/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-[#191B3D] dark:text-white">
                        Ekspor Seluruh Transaksi (.CSV)
                      </div>
                      <div className="text-[11px] text-[#7F8A9E] dark:text-slate-400 mt-0.5">
                        Dapat dibuka langsung di Microsoft Excel, Google Sheets, atau Apple Numbers
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleExportCSV}
                    disabled={exportLoading}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold bg-[#191B3D] hover:bg-[#252856] dark:bg-indigo-600 text-white shadow-xs cursor-pointer whitespace-nowrap disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>{exportLoading ? 'Mengunduh...' : 'Unduh CSV'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------------- */}
            {/* TAB 6: UNDUH APLIKASI / PWA                                      */}
            {/* ----------------------------------------------------------------- */}
            {activeTab === 'app' && (
              <div className="space-y-5 animate-fade-in text-xs">
                <div>
                  <h2 className="text-base font-extrabold text-[#191B3D] dark:text-white">
                    Aplikasi Mobile (PWA)
                  </h2>
                  <p className="text-xs text-[#7F8A9E] dark:text-slate-400">
                    Pasang aplikasi di layar utama HP Anda untuk akses cepat dan offline
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-[#191B3D] dark:text-white">
                        {isInstalled ? 'Aplikasi Sudah Terpasang' : 'Pasang Money Management di HP'}
                      </div>
                      <div className="text-[11px] text-[#61647C] dark:text-slate-400 mt-0.5">
                        {isInstalled
                          ? 'Aplikasi berjalan sebagai aplikasi independen di perangkat Anda.'
                          : 'Akses tanpa browser bar, cepat, ringan, dan mendukung notifikasi lock screen.'}
                      </div>
                    </div>
                  </div>

                  {!isInstalled && (
                    <button
                      type="button"
                      onClick={() => {
                        if (deferredPrompt) {
                          installApp();
                        } else if (openInstallModal) {
                          openInstallModal();
                        }
                      }}
                      className="px-4 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer whitespace-nowrap"
                    >
                      Pasang Sekarang
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
