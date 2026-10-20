import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePWA } from '../context/PWAContext';
import Icon from '../components/Icon';
import NotificationButton from '../components/NotificationButton';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendPushNotification,
  openWhatsAppReminder,
} from '../lib/notifications';

export default function Settings() {
  const { user, updateUser, authFetch } = useAuth();
  const { openInstallModal, isInstalled, isIOS, deferredPrompt, installApp } = usePWA();
  const [activeTab, setActiveTab] = useState('profile');

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currency: 'IDR',
  });
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

  // Preferences state (stored in localStorage)
  const [preferences, setPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem('user_finance_preferences');
      return saved
        ? JSON.parse(saved)
        : {
            budgetCycleDay: '1',
            dateFormat: 'DD/MM/YYYY',
            hideBalanceDashboard: false,
            defaultTxType: 'expense',
            rounding: 'none',
          };
    } catch {
      return {
        budgetCycleDay: '1',
        dateFormat: 'DD/MM/YYYY',
        hideBalanceDashboard: false,
        defaultTxType: 'expense',
        rounding: 'none',
      };
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
  const [permissionStatus, setPermissionStatus] = useState('default');
  const [reminderHour, setReminderHour] = useState('20');
  const [notifFeedback, setNotifFeedback] = useState('');

  // WA Reminder state
  const [waPhone, setWaPhone] = useState('');
  const [waEnabled, setWaEnabled] = useState(false);
  const [waHour, setWaHour] = useState('20');
  const [waVerified, setWaVerified] = useState(false);
  const [lastReminderDate, setLastReminderDate] = useState(null);
  const [waSaving, setWaSaving] = useState(false);
  const [waTesting, setWaTesting] = useState(false);
  const [waMessage, setWaMessage] = useState({ type: '', text: '' });

  // OTP Verification state
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  // OTP cooldown countdown
  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown]);

  // Load reminder settings from backend
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPermissionStatus(getNotificationPermission());
      const savedHour = localStorage.getItem('user_reminder_hour');
      if (!savedHour) {
        localStorage.setItem('user_reminder_hour', '20');
        setReminderHour('20');
      } else {
        setReminderHour(savedHour);
      }
    }
    // Load WA reminder settings from backend
    authFetch('/api/reminder/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setWaPhone(data.phone_number || '');
          setWaEnabled(Boolean(data.reminder_enabled));
          const h = data.reminder_hour !== undefined && data.reminder_hour !== null ? data.reminder_hour.toString() : '20';
          setWaHour(h);
          setReminderHour(h);
          localStorage.setItem('user_reminder_hour', h);
          setWaVerified(Boolean(data.phone_verified));
          setLastReminderDate(data.last_reminder_date || null);
        }
      })
      .catch(() => {});
  }, []);

  const handleEnablePermission = async () => {
    const res = await requestNotificationPermission();
    setPermissionStatus(getNotificationPermission());
    setNotifFeedback(res.message);
    if (res.success) {
      sendPushNotification({
        title: '🎉 Notifikasi Pengingat HP Aktif',
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


  // Send WhatsApp OTP Verification Code
  const handleSendOtp = async () => {
    if (!waPhone.trim()) {
      setWaMessage({ type: 'error', text: 'Masukkan nomor WhatsApp terlebih dahulu.' });
      setTimeout(() => setWaMessage({ type: '', text: '' }), 4000);
      return;
    }
    setOtpLoading(true);
    try {
      const res = await authFetch('/api/reminder/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone_number: waPhone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengirim OTP');
      setOtpSent(true);
      setOtpCooldown(60);
      setWaMessage({ type: 'success', text: `📩 ${data.message}` });
    } catch (err) {
      setWaMessage({ type: 'error', text: err.message });
    } finally {
      setOtpLoading(false);
      setTimeout(() => setWaMessage({ type: '', text: '' }), 6000);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setWaMessage({ type: 'error', text: 'Masukkan 6 digit kode verifikasi OTP.' });
      setTimeout(() => setWaMessage({ type: '', text: '' }), 4000);
      return;
    }
    setOtpLoading(true);
    try {
      const res = await authFetch('/api/reminder/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ otp_code: otpCode.trim(), phone_number: waPhone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kode OTP salah atau kedaluwarsa');
      setWaVerified(true);
      setWaEnabled(true);
      setOtpSent(false);
      setOtpCode('');
      setWaMessage({ type: 'success', text: `🎉 ${data.message}` });
    } catch (err) {
      setWaMessage({ type: 'error', text: err.message });
    } finally {
      setOtpLoading(false);
      setTimeout(() => setWaMessage({ type: '', text: '' }), 6000);
    }
  };

  // Save WA Reminder Settings to backend
  const handleSaveWaReminder = async () => {
    if (!waPhone.trim()) {
      setWaMessage({ type: 'error', text: 'Masukkan nomor HP terlebih dahulu.' });
      setTimeout(() => setWaMessage({ type: '', text: '' }), 4000);
      return;
    }
    setWaSaving(true);
    try {
      const res = await authFetch('/api/reminder/settings', {
        method: 'PUT',
        body: JSON.stringify({
          phone_number: waPhone.trim(),
          reminder_enabled: waEnabled,
          reminder_hour: parseInt(waHour, 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan');
      setWaVerified(Boolean(data.phone_verified));
      setWaMessage({
        type: 'success',
        text: `✅ Pengaturan pengingat WA disimpan! Jadwal: pukul ${waHour}:00 WIB.${!data.phone_verified ? ' Harap verifikasi nomor dengan OTP agar pengingat aktif.' : ''}`
      });
    } catch (err) {
      setWaMessage({ type: 'error', text: err.message });
    } finally {
      setWaSaving(false);
      setTimeout(() => setWaMessage({ type: '', text: '' }), 6000);
    }
  };

  // Test WA Reminder — trigger immediately
  const handleTestWaReminder = async () => {
    if (!waPhone.trim()) {
      setWaMessage({ type: 'error', text: 'Simpan nomor HP dulu sebelum tes.' });
      setTimeout(() => setWaMessage({ type: '', text: '' }), 4000);
      return;
    }
    setWaTesting(true);
    try {
      // First save the current phone, then trigger test
      await authFetch('/api/reminder/settings', {
        method: 'PUT',
        body: JSON.stringify({
          phone_number: waPhone.trim(),
          reminder_enabled: waEnabled,
          reminder_hour: parseInt(waHour, 10),
        }),
      });
      const res = await authFetch('/api/reminder/test', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal tes');
      setWaMessage({ type: 'success', text: `📱 ${data.message}` });
    } catch (err) {
      setWaMessage({ type: 'error', text: err.message });
    } finally {
      setWaTesting(false);
    }
  };

  // Export state

  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm((prev) => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  // Handle Profile Update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMessage({ type: '', text: '' });
    setProfileLoading(true);

    try {
      const res = await authFetch('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: profileForm.name.trim(),
          email: profileForm.email.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memperbarui profil');
      }

      updateUser(data.user);
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

  // Handle Password Update
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
      const res = await authFetch('/api/auth/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memperbarui kata sandi');
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
      if (waPhone.trim()) {
        await handleSaveWaReminder();
      }
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
    } catch (err) {
      alert(err.message);
    } finally {
      setExportLoading(false);
    }
  };

  const userName = user?.name || 'Nadia Putri';
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const TABS = [
    { id: 'profile', label: 'Profil Pengguna', icon: 'person' },
    { id: 'preferences', label: 'Preferensi Keuangan', icon: 'tune' },
    { id: 'security', label: 'Keamanan & Sandi', icon: 'lock' },
    { id: 'notifications', label: 'Notifikasi', icon: 'notifications' },
    { id: 'data', label: 'Cadangan & Data', icon: 'cloud_download' },
    { id: 'app', label: 'Unduh Aplikasi', icon: 'smartphone' },
  ];

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-left" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
            Ruang personal
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>&gt;</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            Pengaturan
          </span>
        </div>
        <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--income-color)' }} />
            Data tersimpan
          </div>

          <NotificationButton />

          <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
            30 September 2026
          </span>
        </div>
      </div>

      <div className="page-content" style={{ paddingBottom: 60 }}>
        {/* Signature Biru Dongker Hero Banner */}
        <div
          className="navy-banner"
          style={{
            borderRadius: 18,
            padding: '28px 32px',
            marginBottom: 24,
            alignItems: 'center',
            overflow: 'visible',
            position: 'relative',
            zIndex: 30,
          }}
        >
          <div className="navy-banner-left" style={{ flex: 1, position: 'relative', zIndex: 40 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', marginBottom: 6, letterSpacing: '-0.4px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="settings" size={26} /> Pengaturan Akun
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 0, maxWidth: 500 }}>
              Sesuaikan data identitas, preferensi pembukuan, keamanan kata sandi, dan cadangan data finansialmu.
            </p>
          </div>

          <div className="navy-banner-right" style={{ position: 'relative', zIndex: 40 }}>
            <div
              style={{
                background: '#FAF8F5',
                borderRadius: 16,
                padding: '16px 22px',
                minWidth: 260,
                textAlign: 'left',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                border: '1px solid #ECE7DE',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 15,
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {userName}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--income-color)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--income-color)' }} />
                  Akun Personal Aktif
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation & Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24, alignItems: 'start' }}>
          {/* Side Tabs */}
          <div className="card" style={{ padding: '12px 10px', borderRadius: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '8px 12px 10px', letterSpacing: '0.06em' }}>
              Menu Pengaturan
            </div>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '11px 14px',
                    borderRadius: 10,
                    border: 'none',
                    background: isActive ? 'var(--primary-50)' : 'transparent',
                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: 13,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    marginBottom: 4,
                  }}
                  onMouseOver={(e) => {
                    if (!isActive) e.currentTarget.style.background = '#F8FAFC';
                  }}
                  onMouseOut={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Icon
                    name={tab.icon}
                    size={18}
                    style={{ color: isActive ? 'var(--primary)' : 'var(--text-muted)' }}
                  />
                  <span>{tab.label}</span>
                  {isActive && (
                    <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)' }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content Panel */}
          <div>
            {/* TAB 1: PROFIL PENGGUNA */}
            {activeTab === 'profile' && (
              <div className="card" style={{ padding: '28px 32px', borderRadius: 16 }}>
                <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: 16, marginBottom: 24 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                    Profil & Identitas
                  </h2>
                  <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>
                    Informasi akun Anda yang digunakan untuk personalisasi ruang finansial Money Management.
                  </p>
                </div>

                {profileMessage.text && (
                  <div
                    className={profileMessage.type === 'success' ? 'alert alert-success' : 'alert alert-error'}
                    style={{ marginBottom: 20 }}
                  >
                    <Icon name={profileMessage.type === 'success' ? 'check_circle' : 'error'} size={18} />
                    <span>{profileMessage.text}</span>
                  </div>
                )}

                <form onSubmit={handleProfileSubmit}>
                  {/* Avatar Section */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, padding: '16px', background: 'var(--bg-card2)', borderRadius: 12, border: '1px solid var(--border-light)' }}>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        background: 'var(--primary)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: 20,
                        boxShadow: '0 4px 12px rgba(14,32,56,0.18)',
                      }}
                    >
                      {initials}
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                        Inisial Profil: {initials}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                        Inisial avatar dihasilkan otomatis dari nama lengkap Anda.
                      </div>
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="form-group">
                    <label className="form-label">Nama Lengkap</label>
                    <input
                      type="text"
                      className="form-input"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      placeholder="Masukkan nama lengkap Anda"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Alamat Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      placeholder="nama@email.com"
                      required
                    />
                    <span style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                      Digunakan untuk autentikasi saat masuk ke Money Management.
                    </span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mata Uang Utama</label>
                    <select
                      className="form-select"
                      value={profileForm.currency}
                      onChange={(e) => setProfileForm({ ...profileForm, currency: e.target.value })}
                      disabled
                      style={{ opacity: 0.85 }}
                    >
                      <option value="IDR">IDR - Rupiah Indonesia (Rp)</option>
                    </select>
                    <span style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                      Format pencatatan baku sistem disesuaikan dengan Rupiah Indonesia.
                    </span>
                  </div>

                  <div style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={profileLoading}
                      style={{ padding: '10px 24px', fontSize: 13.5, fontWeight: 700 }}
                    >
                      {profileLoading ? 'Menyimpan...' : 'Simpan Perubahan Profil'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: PREFERENSI KEUANGAN */}
            {activeTab === 'preferences' && (
              <div className="card" style={{ padding: '28px 32px', borderRadius: 16 }}>
                <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: 16, marginBottom: 24 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                    Preferensi Siklus & Pembukuan
                  </h2>
                  <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>
                    Sesuaikan perhitungan siklus anggaran bulanan dan preferensi visual aplikasi.
                  </p>
                </div>

                {prefSaved && (
                  <div className="alert alert-success" style={{ marginBottom: 20 }}>
                    <Icon name="check_circle" size={18} />
                    <span>Preferensi keuangan berhasil disimpan!</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Awal Siklus Anggaran Bulanan (Tanggal Gajian)</label>
                  <select
                    className="form-select"
                    value={preferences.budgetCycleDay}
                    onChange={(e) => setPreferences({ ...preferences, budgetCycleDay: e.target.value })}
                  >
                    <option value="1">Tanggal 1 setiap bulan (Awal Kalender)</option>
                    <option value="25">Tanggal 25 setiap bulan (Standar Gajian Indonesia)</option>
                    <option value="26">Tanggal 26 setiap bulan</option>
                    <option value="28">Tanggal 28 setiap bulan</option>
                    <option value="15">Tanggal 15 setiap bulan (Tengah Bulan)</option>
                  </select>
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                    Laporan dan kuota anggaran akan dihitung berdasarkan siklus tanggal ini.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Format Tampilan Tanggal</label>
                  <select
                    className="form-select"
                    value={preferences.dateFormat}
                    onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (Contoh: 30/09/2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (Standar ISO: 2026-09-30)</option>
                    <option value="D MMMM YYYY">D MMMM YYYY (Contoh: 30 September 2026)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Tipe Transaksi Default Saat Tambah Cepat</label>
                  <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="defaultTxType"
                        value="expense"
                        checked={preferences.defaultTxType === 'expense'}
                        onChange={(e) => setPreferences({ ...preferences, defaultTxType: e.target.value })}
                      />
                      <span>Pengeluaran (Rekomendasi)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="defaultTxType"
                        value="income"
                        checked={preferences.defaultTxType === 'income'}
                        onChange={(e) => setPreferences({ ...preferences, defaultTxType: e.target.value })}
                      />
                      <span>Pemasukan</span>
                    </label>
                  </div>
                </div>

                {/* Tema Visual & Mode Malam */}
                <div className="form-group" style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border-light)' }}>
                  <label className="form-label" style={{ marginBottom: 12 }}>Tema Tampilan Aplikasi</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                    <div
                      onClick={() => setTheme('light')}
                      style={{
                        padding: '16px',
                        borderRadius: 14,
                        border: !isDark ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: !isDark ? 'var(--primary-50)' : 'var(--bg-card)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        transition: 'all 0.18s ease',
                        boxShadow: !isDark ? 'var(--shadow-sm)' : 'none',
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: '#FEF3C7',
                          color: '#D97706',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Icon name="light_mode" size={22} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>Mode Terang</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>Cerah, bersih &amp; tajam</div>
                      </div>
                      {!isDark && (
                        <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: 16 }}>✓</div>
                      )}
                    </div>

                    <div
                      onClick={() => setTheme('dark')}
                      style={{
                        padding: '16px',
                        borderRadius: 14,
                        border: isDark ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: isDark ? 'var(--primary-50)' : 'var(--bg-card)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        transition: 'all 0.18s ease',
                        boxShadow: isDark ? 'var(--shadow-sm)' : 'none',
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: '#1E293B',
                          color: '#38BDF8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Icon name="dark_mode" size={22} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>Mode Malam</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>Gelap midnight, hemat daya &amp; nyaman</div>
                      </div>
                      {isDark && (
                        <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: 16 }}>✓</div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={handleSavePreferences}
                    className="btn btn-primary"
                    style={{ padding: '10px 24px', fontSize: 13.5, fontWeight: 700 }}
                  >
                    Simpan Preferensi
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: KEAMANAN & SANDI */}
            {activeTab === 'security' && (
              <div className="card" style={{ padding: '28px 32px', borderRadius: 16 }}>
                <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: 16, marginBottom: 24 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                    Keamanan & Kata Sandi
                  </h2>
                  <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>
                    Lindungi privasi akun finansial Anda dengan kata sandi yang kuat dan terenkripsi.
                  </p>
                </div>

                {passwordMessage.text && (
                  <div
                    className={passwordMessage.type === 'success' ? 'alert alert-success' : 'alert alert-error'}
                    style={{ marginBottom: 20 }}
                  >
                    <Icon name={passwordMessage.type === 'success' ? 'check_circle' : 'error'} size={18} />
                    <span>{passwordMessage.text}</span>
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit}>
                  <div className="form-group">
                    <label className="form-label">Kata Sandi Saat Ini</label>
                    <input
                      type="password"
                      className="form-input"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="Masukkan kata sandi lama Anda"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Kata Sandi Baru</label>
                    <input
                      type="password"
                      className="form-input"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Minimal 6 karakter kombinasi"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Konfirmasi Kata Sandi Baru</label>
                    <input
                      type="password"
                      className="form-input"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Ulangi kata sandi baru"
                      required
                    />
                  </div>

                  {/* Security Highlights */}
                  <div style={{ padding: '16px', background: 'var(--bg-card2)', borderRadius: 12, border: '1px solid var(--border-light)', margin: '20px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 700, color: 'var(--primary)', marginBottom: 6 }}>
                      <Icon name="verified_user" size={18} style={{ color: 'var(--income-color)' }} />
                      <span>Standar Keamanan Enkripsi Bcrypt</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      Kata sandi Anda disimpan menggunakan enkripsi hash salt 10 putaran standar industri. Tidak ada pihak luar yang dapat membaca kata sandi asli Anda.
                    </p>
                  </div>

                  <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={passwordLoading}
                      style={{ padding: '10px 24px', fontSize: 13.5, fontWeight: 700 }}
                    >
                      {passwordLoading ? 'Memproses...' : 'Perbarui Kata Sandi'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 4: NOTIFIKASI */}
            {activeTab === 'notifications' && (
              <div className="card" style={{ padding: '28px 32px', borderRadius: 16 }}>
                <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: 16, marginBottom: 24 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                    Pengaturan Pemberitahuan
                  </h2>
                  <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>
                    Atur peringatan dini keuangan agar pengeluaran tetap terkontrol tepat waktu.
                  </p>
                </div>

                {notifSaved && (
                  <div className="alert alert-success" style={{ marginBottom: 20 }}>
                    <Icon name="check_circle" size={18} />
                    <span>Pengaturan notifikasi berhasil diperbarui!</span>
                  </div>
                )}

                {notifFeedback && (
                  <div className="alert alert-success" style={{ marginBottom: 20 }}>
                    <Icon name="notifications_active" size={18} />
                    <span>{notifFeedback}</span>
                  </div>
                )}

                {/* ═══════════════════════════════════════════════════════════
                    SECTION: WhatsApp Reminder — Nomor HP
                ═══════════════════════════════════════════════════════════ */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, #E7F9EE 0%, #F0FDF4 100%)',
                    border: '2px solid #22C55E',
                    borderRadius: 16,
                    padding: '24px 26px',
                    marginBottom: 24,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Decorative circle */}
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(34,197,94,0.08)' }} />

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(37,211,102,0.3)' }}>
                        <Icon name="chat" size={22} style={{ color: '#FFFFFF' }} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#15803D', margin: 0 }}>
                            Reminder WhatsApp ke HP 📲
                          </h3>
                          {waVerified ? (
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Icon name="verified" size={13} /> Terverifikasi
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Icon name="warning" size={13} /> Belum Diverifikasi
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 12, color: '#16A34A', margin: '2px 0 0' }}>
                          Otomatis kirim pesan WA jika kamu belum mencatat transaksi harian
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 999, background: waEnabled && waVerified ? '#DCFCE7' : '#F1F5F9', color: waEnabled && waVerified ? '#16A34A' : '#64748B' }}>
                        {waEnabled && waVerified ? '● Pengingat Aktif' : '○ Nonaktif'}
                      </span>
                    </div>
                  </div>

                  {/* Feedback Message */}
                  {waMessage.text && (
                    <div
                      className={waMessage.type === 'success' ? 'alert alert-success' : 'alert alert-error'}
                      style={{ margin: '12px 0 16px', fontSize: 12.5 }}
                    >
                      <Icon name={waMessage.type === 'success' ? 'check_circle' : 'error'} size={16} />
                      <span>{waMessage.text}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Phone Input with Verification Status */}
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#166534', marginBottom: 6 }}>
                        📱 Nomor WhatsApp Aktif:
                      </label>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1.5px solid #86EFAC', borderRadius: 10, padding: '0 12px', flexShrink: 0 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#166534' }}>🇮🇩 +62</span>
                        </div>
                        <input
                          type="tel"
                          className="form-input"
                          value={waPhone}
                          onChange={(e) => {
                            setWaPhone(e.target.value);
                            // If user edits phone, it resets verified badge until saved/verified
                            if (waVerified) setWaVerified(false);
                          }}
                          placeholder="8123456789 (tanpa angka 0 di depan)"
                          style={{ flex: 1, minWidth: 200, border: '1.5px solid #86EFAC', background: '#FFFFFF', fontSize: 13.5 }}
                          id="wa-phone-input"
                        />
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={otpLoading || !waPhone.trim() || otpCooldown > 0}
                          style={{
                            background: waVerified ? '#0F766E' : '#D97706',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: 10,
                            padding: '0 16px',
                            fontSize: 12.5,
                            fontWeight: 700,
                            cursor: (otpLoading || !waPhone.trim() || otpCooldown > 0) ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            opacity: (otpLoading || !waPhone.trim() || otpCooldown > 0) ? 0.65 : 1,
                            transition: 'all 0.15s',
                          }}
                        >
                          <Icon name={otpLoading ? 'hourglass_empty' : 'verified_user'} size={15} />
                          <span>
                            {otpCooldown > 0
                              ? `Tunggu (${otpCooldown}s)`
                              : waVerified
                              ? 'Verifikasi Ulang'
                              : 'Kirim Kode OTP'}
                          </span>
                        </button>
                      </div>
                      <div style={{ fontSize: 11, color: '#16A34A', marginTop: 4 }}>
                        Contoh: 81234567890. Untuk keamanan, kode verifikasi 6 digit akan dikirim ke WhatsApp ini.
                      </div>
                    </div>

                    {/* OTP Input box if OTP sent or not verified */}
                    {(otpSent || (!waVerified && waPhone.trim())) && (
                      <div
                        style={{
                          background: '#FFFFFF',
                          borderRadius: 12,
                          padding: '16px 18px',
                          border: '1.5px dashed #34D399',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <Icon name="lock" size={17} style={{ color: '#059669' }} />
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#065F46' }}>
                            Masukkan 6 Digit Kode OTP Verifikasi
                          </div>
                        </div>
                        <p style={{ fontSize: 11.5, color: '#047857', margin: '0 0 12px' }}>
                          Periksa pesan WhatsApp yang kami kirimkan ke nomor Anda, lalu masukkan 6 digit kodenya di bawah ini:
                        </p>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="Contoh: 123456"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                            style={{
                              maxWidth: 160,
                              textAlign: 'center',
                              letterSpacing: '3px',
                              fontWeight: 700,
                              fontSize: 16,
                              padding: '8px 12px',
                              borderRadius: 8,
                              border: '1.5px solid #059669',
                            }}
                          />
                          <button
                            type="button"
                            onClick={handleVerifyOtp}
                            disabled={otpLoading || otpCode.trim().length !== 6}
                            style={{
                              background: '#059669',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: 8,
                              padding: '8px 20px',
                              fontSize: 13,
                              fontWeight: 700,
                              cursor: (otpLoading || otpCode.trim().length !== 6) ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              opacity: (otpLoading || otpCode.trim().length !== 6) ? 0.6 : 1,
                            }}
                          >
                            <Icon name={otpLoading ? 'hourglass_empty' : 'check'} size={16} />
                            <span>{otpLoading ? 'Memverifikasi...' : 'Verifikasi Sekarang'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Reminder Hour & Toggle Settings */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                        gap: 14,
                        background: '#FFFFFF',
                        borderRadius: 12,
                        padding: '16px',
                        border: '1px solid #BBF7D0',
                      }}
                    >
                      {/* Jam Pengingat — hardcoded 20:00 WIB */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#F0FDF4', borderRadius: 10, padding: '12px 14px', border: '1.5px solid #86EFAC' }}>
                        <div style={{ fontSize: 28 }}>⏰</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#15803D' }}>Pengingat Otomatis Jam 20:00 WIB</div>
                          <div style={{ fontSize: 11.5, color: '#16A34A', marginTop: 2 }}>
                            Sistem otomatis mengirim WA setiap hari pukul <strong>20:00 WIB</strong> jika belum ada transaksi yang dicatat. Tidak perlu setting jam.
                          </div>
                        </div>
                      </div>

                      {/* Toggle Aktif */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#15803D' }}>Aktifkan Notifikasi WhatsApp</div>
                          <div style={{ fontSize: 11.5, color: '#16A34A', marginTop: 2 }}>
                            {waVerified ? 'Otomatis kirim jika belum input data' : 'Aktif setelah nomor HP terverifikasi'}
                          </div>
                        </div>
                        <label style={{ position: 'relative', display: 'inline-block', width: 46, height: 26, flexShrink: 0 }}>
                          <input
                            type="checkbox"
                            checked={waEnabled}
                            onChange={(e) => setWaEnabled(e.target.checked)}
                            style={{ opacity: 0, width: 0, height: 0 }}
                          />
                          <span
                            style={{
                              position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                              background: waEnabled ? '#22C55E' : '#CBD5E1',
                              borderRadius: 26, transition: '0.3s',
                            }}
                          >
                            <span style={{
                              position: 'absolute', content: '', height: 20, width: 20,
                              left: waEnabled ? 22 : 3, bottom: 3,
                              background: '#FFFFFF', borderRadius: '50%', transition: '0.3s',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                            }} />
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Status Info (Last Reminder & Prevention) */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, fontSize: 11.5, color: '#166534' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Icon name="history" size={15} style={{ color: '#16A34A' }} />
                        <span>
                          Pengingat Terakhir:{' '}
                          <strong>
                            {lastReminderDate
                              ? new Date(lastReminderDate).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                })
                              : 'Belum pernah dikirim'}
                          </strong>
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Icon name="shield" size={15} style={{ color: '#16A34A' }} />
                        <span>Anti-duplikasi aktif (maksimal 1x sehari)</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={handleSaveWaReminder}
                        disabled={waSaving}
                        style={{
                          background: '#16A34A', color: '#FFFFFF', border: 'none',
                          borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700,
                          cursor: waSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 7,
                          opacity: waSaving ? 0.7 : 1, transition: 'all 0.15s',
                        }}
                      >
                        <Icon name={waSaving ? 'hourglass_empty' : 'save'} size={16} />
                        <span>{waSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleTestWaReminder}
                        disabled={waTesting || !waPhone.trim()}
                        style={{
                          background: '#25D366', color: '#FFFFFF', border: 'none',
                          borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700,
                          cursor: (waTesting || !waPhone.trim()) ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', gap: 7,
                          opacity: (waTesting || !waPhone.trim()) ? 0.6 : 1, transition: 'all 0.15s',
                        }}
                      >
                        <Icon name={waTesting ? 'hourglass_empty' : 'send'} size={16} />
                        <span>{waTesting ? 'Mengirim...' : 'Tes Kirim WA Sekarang'}</span>
                      </button>
                    </div>

                    {/* Fonnte Setup Guide */}
                    <details style={{ cursor: 'pointer' }}>
                      <summary style={{ fontSize: 12, fontWeight: 700, color: '#15803D', userSelect: 'none' }}>
                        ⚙️ Cara setup Fonnte API (klik untuk lihat panduan)
                      </summary>
                      <div style={{ marginTop: 10, background: '#FFFFFF', borderRadius: 10, padding: '14px 16px', border: '1px solid #BBF7D0' }}>
                        <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#166534', lineHeight: 1.9 }}>
                          <li>Daftar gratis di <strong>fonnte.com</strong></li>
                          <li>Scan QR Code dengan HP kamu (sambungkan WhatsApp)</li>
                          <li>Copy <strong>API Token</strong> dari dashboard Fonnte</li>
                          <li>Buka file <code style={{ background: '#F0FDF4', padding: '1px 4px', borderRadius: 4 }}>.env</code> di folder project</li>
                          <li>Isi: <code style={{ background: '#F0FDF4', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>FONNTE_TOKEN=token_kamu_disini</code></li>
                          <li>Restart server (npm run dev)</li>
                        </ol>
                      </div>
                    </details>
                  </div>
                </div>


                <div
                  style={{
                    background: 'var(--bg-card2)',
                    border: '1.5px solid var(--primary-light, #93C5FD)',
                    borderRadius: 14,
                    padding: '20px 22px',
                    marginBottom: 20,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Icon name="smartphone" size={20} style={{ color: 'var(--primary)' }} />
                        <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          Pengingat Harian ke HP &amp; Browser 📱
                        </h3>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, marginBottom: 0, maxWidth: 520, lineHeight: 1.5 }}>
                        Notifikasi otomatis muncul di HP/laptop kamu setiap pukul <strong>{reminderHour || 20}:00 WIB</strong> jika belum ada transaksi yang dicatat hari itu.
                        Juga langsung muncul setiap kali input transaksi baru.
                      </p>
                    </div>

                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: 999,
                        flexShrink: 0,
                        background:
                          permissionStatus === 'granted'
                            ? 'var(--income-bg, #DCFCE7)'
                            : '#FEF3C7',
                        color:
                          permissionStatus === 'granted'
                            ? 'var(--income-color, #16A34A)'
                            : '#D97706',
                      }}
                    >
                      {permissionStatus === 'granted' ? '✅ Notif HP Aktif' : '⚠️ Izin Belum Aktif'}
                    </span>
                  </div>

                  {/* Cara Kerja Box */}
                  <div style={{ background: permissionStatus === 'granted' ? '#F0FDF4' : '#FFFBEB', border: `1px solid ${permissionStatus === 'granted' ? '#BBF7D0' : '#FDE68A'}`, borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: permissionStatus === 'granted' ? '#15803D' : '#92400E', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Icon name={permissionStatus === 'granted' ? 'check_circle' : 'info'} size={15} />
                      {permissionStatus === 'granted' ? 'Notifikasi HP sudah aktif! Cara kerjanya:' : 'Cara mengaktifkan notifikasi di HP kamu:'}
                    </div>
                    {permissionStatus === 'granted' ? (
                      <ol style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: '#166534', lineHeight: 1.7 }}>
                        <li>Buka website ini di <strong>browser HP</strong> (Chrome Android/Safari iOS)</li>
                        <li>Notifikasi otomatis muncul di <strong>notification bar HP</strong> pukul <strong>{reminderHour || 20}:00 WIB</strong></li>
                        <li>Juga langsung muncul setiap kali kamu <strong>input transaksi baru</strong></li>
                        <li>Website harus pernah dibuka di HP-mu minimal sekali untuk aktif</li>
                      </ol>
                    ) : (
                      <ol style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: '#92400E', lineHeight: 1.7 }}>
                        <li>Klik tombol <strong>&quot;Aktifkan Notifikasi HP&quot;</strong> di bawah ini</li>
                        <li>Klik <strong>&quot;Allow / Izinkan&quot;</strong> saat browser meminta izin</li>
                        <li>Buka website ini juga di <strong>Chrome HP / browser HP-mu</strong>, lakukan langkah yang sama</li>
                        <li>Notifikasi akan muncul di <strong>notification bar HP</strong> seperti WA/Instagram</li>
                      </ol>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#EFF6FF', borderRadius: 10, padding: '12px 14px', border: '1.5px solid #BFDBFE' }}>
                      <div style={{ fontSize: 22 }}>🔔</div>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 800, color: '#1D4ED8' }}>Notifikasi Browser Jam 20:00</div>
                        <div style={{ fontSize: 11, color: '#3B82F6', marginTop: 2 }}>Muncul otomatis di layar HP/laptop pukul <strong>20:00</strong> jika belum ada transaksi hari ini.</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                      {permissionStatus !== 'granted' ? (
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={handleEnablePermission}
                          style={{ padding: '9px 16px', fontSize: 12.5, fontWeight: 700, gap: 6 }}
                        >
                          <Icon name="notifications_active" size={16} />
                          <span>Aktifkan Notifikasi HP</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={handleTestPush}
                          style={{ padding: '9px 16px', fontSize: 12.5, fontWeight: 700, gap: 6 }}
                        >
                          <Icon name="send" size={16} />
                          <span>Tes Notifikasi Sekarang</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openWhatsAppReminder()}
                        style={{
                          background: '#25D366',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: 8,
                          padding: '9px 14px',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Icon name="chat" size={15} />
                        <span>WA Reminder</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Info Box: Keterbatasan Web Push */}
                <div style={{ background: '#F8FAFC', border: '1px solid var(--border-light)', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon name="info" size={14} /> Cara Notifikasi Muncul di HP
                  </div>
                  <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: 0, lineHeight: 1.65 }}>
                    Notifikasi ini adalah <strong>Web Browser Notification</strong> — muncul seperti notifikasi WhatsApp/Instagram di HP kamu,
                    selama kamu pernah membuka website ini di browser HP (Chrome direkomendasikan) dan mengizinkan notifikasi.
                    Service Worker berjalan di background browser, sehingga notifikasi bisa muncul meski tab sudah diminimize.
                    <br /><br />
                    <strong style={{ color: 'var(--primary)' }}>Penting:</strong> Buka website ini di browser HP kamu → izinkan notifikasi → selesai!
                    Notifikasi jam 20:00 dan saat input transaksi akan langsung muncul di notification bar HP-mu.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: -4 }}>
                    Jenis Peringatan Keuangan Otomatis
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: 'var(--bg-card2)', borderRadius: 12, border: '1px solid var(--border-light)' }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                        Peringatan Tagihan Jatuh Tempo
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        Ingatkan 1-2 hari sebelum tagihan rutin jatuh tempo agar tidak terkena denda.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifSettings.billDueReminder}
                      onChange={(e) => setNotifSettings({ ...notifSettings, billDueReminder: e.target.checked })}
                      style={{ width: 20, height: 20, cursor: 'pointer', accentColor: 'var(--primary)' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: 'var(--bg-card2)', borderRadius: 12, border: '1px solid var(--border-light)' }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                        Peringatan Kuota Anggaran &gt; 80%
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        Beri notifikasi warna kuning/merah saat pengeluaran mendekati atau melampaui batas anggaran.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifSettings.budgetOverrunAlert}
                      onChange={(e) => setNotifSettings({ ...notifSettings, budgetOverrunAlert: e.target.checked })}
                      style={{ width: 20, height: 20, cursor: 'pointer', accentColor: 'var(--primary)' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: 'var(--bg-card2)', borderRadius: 12, border: '1px solid var(--border-light)' }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                        Pencapaian Target Tabungan
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        Rayakan notifikasi apresiasi saat tujuan tabungan berhasil mencapai 100%.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifSettings.savingsMilestoneAlert}
                      onChange={(e) => setNotifSettings({ ...notifSettings, savingsMilestoneAlert: e.target.checked })}
                      style={{ width: 20, height: 20, cursor: 'pointer', accentColor: 'var(--primary)' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: 'var(--bg-card2)', borderRadius: 12, border: '1px solid var(--border-light)' }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                        Rangkuman Finansial Mingguan
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        Kirim ringkasan tren saldo mingguan ke panel notifikasi.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifSettings.weeklyDigest}
                      onChange={(e) => setNotifSettings({ ...notifSettings, weeklyDigest: e.target.checked })}
                      style={{ width: 20, height: 20, cursor: 'pointer', accentColor: 'var(--primary)' }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 14, flexWrap: 'wrap' }}>
                  {notifSaved && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16A34A', fontSize: 13, fontWeight: 700, background: '#DCFCE7', padding: '6px 14px', borderRadius: 8, border: '1px solid #86EFAC' }}>
                      <Icon name="check_circle" size={17} />
                      <span>Pengaturan notifikasi berhasil disimpan!</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveNotifs}
                    disabled={notifSaving}
                    className="btn btn-primary"
                    style={{
                      padding: '10px 24px',
                      fontSize: 13.5,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: notifSaved ? '#16A34A' : undefined,
                      borderColor: notifSaved ? '#16A34A' : undefined,
                      transition: 'all 0.2s ease',
                      cursor: notifSaving ? 'not-allowed' : 'pointer',
                      opacity: notifSaving ? 0.75 : 1,
                    }}
                  >
                    <Icon name={notifSaving ? 'hourglass_empty' : notifSaved ? 'check' : 'save'} size={18} />
                    <span>{notifSaving ? 'Menyimpan...' : notifSaved ? 'Tersimpan!' : 'Simpan Pengaturan Notifikasi'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 5: CADANGAN & DATA */}
            {activeTab === 'data' && (
              <div className="card" style={{ padding: '28px 32px', borderRadius: 16 }}>
                <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: 16, marginBottom: 24 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                    Cadangan Data & Ekspor
                  </h2>
                  <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>
                    Unduh salinan berkas catatan keuangan Anda dalam format file yang dapat dibuka di spreadsheet seperti Microsoft Excel atau Google Sheets.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Export CSV Card */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', background: '#FAFBFD', borderRadius: 14, border: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                        <Icon name="description" size={20} style={{ color: 'var(--primary)' }} />
                        <span>Ekspor Transaksi (.CSV)</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, maxWidth: 440 }}>
                        Dapatkan seluruh data riwayat transaksi, pemasukan, pengeluaran, kategori, dan dompet dalam format tabel CSV.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleExportCSV}
                      disabled={exportLoading}
                      style={{ padding: '9px 18px', fontSize: 12.5 }}
                    >
                      <Icon name="download" size={16} />
                      <span>{exportLoading ? 'Mengekspor...' : 'Unduh CSV'}</span>
                    </button>
                  </div>

                  {/* System & Storage Info Card */}
                  <div style={{ padding: '20px 24px', background: 'var(--bg-card2)', borderRadius: 14, border: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
                      Informasi Database & Penyimpanan
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                      <div style={{ padding: '12px 14px', background: '#FFFFFF', borderRadius: 10, border: '1px solid var(--border-light)' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Tipe Database</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary)', marginTop: 2 }}>PostgreSQL</div>
                      </div>
                      <div style={{ padding: '12px 14px', background: '#FFFFFF', borderRadius: 10, border: '1px solid var(--border-light)' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Status Sinkronisasi</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--income-color)', marginTop: 2 }}>Realtime Aktif</div>
                      </div>
                      <div style={{ padding: '12px 14px', background: '#FFFFFF', borderRadius: 10, border: '1px solid var(--border-light)' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Protokol Enkripsi</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary)', marginTop: 2 }}>JWT + Bcrypt</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: UNDUH APLIKASI (PWA) */}
            {activeTab === 'app' && (
              <div className="card" style={{ padding: '28px 32px', borderRadius: 16 }}>
                <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: 16, marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Icon name="smartphone" size={22} style={{ color: 'var(--primary)' }} />
                        <span>Unduh Aplikasi (PWA)</span>
                      </h2>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                        Gunakan Money Management layaknya aplikasi bawaan ponsel (Android &amp; iOS) atau software desktop tanpa perlu lewat toko aplikasi.
                      </p>
                    </div>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700,
                        background: isInstalled ? 'rgba(74, 227, 181, 0.15)' : 'rgba(82, 181, 253, 0.15)',
                        color: isInstalled ? '#059669' : '#0284C7',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: isInstalled ? '#059669' : '#0284C7' }} />
                      {isInstalled ? 'Aplikasi Terpasang di Perangkat Ini' : 'Dapat Diunduh Langsung'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* Hero App Banner */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #0B1728 0%, #162B48 100%)',
                      borderRadius: 16,
                      padding: '24px 28px',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 20,
                      boxShadow: '0 8px 24px rgba(11,23,40,0.2)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, maxWidth: 500 }}>
                      <img
                        src="/icon-192.png"
                        alt="Money Management App Icon"
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 16,
                          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                          border: '2px solid rgba(255,255,255,0.15)',
                        }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#4AE3B5', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                            Progressive Web App
                          </span>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>• Bebas Iklan</span>
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>Money Management Mobile &amp; Desktop</div>
                        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.75)', marginTop: 4, lineHeight: 1.4 }}>
                          Buka seketika dari beranda ponsel, nikmati tampilan layar penuh, dan terima pengingat catat keuangan setiap hari.
                        </div>
                      </div>
                    </div>

                    <div>
                      {isInstalled ? (
                        <div
                          style={{
                            background: 'rgba(74, 227, 181, 0.18)',
                            border: '1px solid rgba(74, 227, 181, 0.4)',
                            color: '#4AE3B5',
                            padding: '10px 18px',
                            borderRadius: 12,
                            fontWeight: 700,
                            fontSize: 13,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <Icon name="check_circle" size={18} />
                          <span>Sudah Terpasang</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={installApp}
                          style={{
                            padding: '12px 22px',
                            borderRadius: 12,
                            background: 'linear-gradient(135deg, #4AE3B5 0%, #34D399 100%)',
                            color: '#0B1728',
                            border: 'none',
                            fontWeight: 800,
                            fontSize: 13.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            cursor: 'pointer',
                            boxShadow: '0 4px 14px rgba(74, 227, 181, 0.35)',
                            transition: 'all 0.2s',
                          }}
                        >
                          <Icon name="download" size={18} />
                          <span>Unduh &amp; Pasang Sekarang</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Keunggulan Fitur App */}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
                      Keunggulan Memasang Sebagai Aplikasi:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                      <div style={{ padding: '16px', background: 'var(--bg-secondary, #FAFBFD)', borderRadius: 14, border: '1px solid var(--border-light)' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(74,227,181,0.15)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                          <Icon name="speed" size={20} />
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Super Cepat &amp; Hemat Kuota</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                          Hanya ~2 MB, aset antarmuka langsung tersimpan di cache lokal ponsel Anda.
                        </div>
                      </div>

                      <div style={{ padding: '16px', background: 'var(--bg-secondary, #FAFBFD)', borderRadius: 14, border: '1px solid var(--border-light)' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(82,181,253,0.15)', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                          <Icon name="fullscreen" size={20} />
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Layar Penuh (Standalone)</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                          Tanpa bilah browser, navigasi mulus dan nyaman seperti aplikasi Play Store.
                        </div>
                      </div>

                      <div style={{ padding: '16px', background: 'var(--bg-secondary, #FAFBFD)', borderRadius: 14, border: '1px solid var(--border-light)' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,0.15)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                          <Icon name="schedule" size={20} />
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Pengingat Rutin Jam 20:00</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                          Dapatkan pengingat otomatis tiap malam langsung di layar notifikasi perangkat.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Panduan Instalasi Langkah Demi Langkah */}
                  <div style={{ padding: '20px 24px', background: '#F8FAFC', borderRadius: 14, border: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
                      Panduan Manual Pemasangan di Berbagai Perangkat:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                      <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: 12, border: '1px solid var(--border-light)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#0284C7' }}>
                          <Icon name="android" size={18} />
                          <span>Android (Google Chrome / Edge)</span>
                        </div>
                        <ol style={{ fontSize: 12, color: 'var(--text-secondary)', paddingLeft: 18, marginTop: 8, lineHeight: 1.5 }}>
                          <li>Ketuk menu titik tiga (⋮) di pojok kanan atas browser.</li>
                          <li>Pilih <strong>&quot;Pasang aplikasi&quot;</strong> atau <strong>&quot;Tambahkan ke Layar Utama&quot;</strong>.</li>
                          <li>Ketuk <strong>&quot;Instal&quot;</strong>. Selesai!</li>
                        </ol>
                      </div>

                      <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: 12, border: '1px solid var(--border-light)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#0B1728' }}>
                          <Icon name="apple" size={18} />
                          <span>iPhone / iPad (Safari)</span>
                        </div>
                        <ol style={{ fontSize: 12, color: 'var(--text-secondary)', paddingLeft: 18, marginTop: 8, lineHeight: 1.5 }}>
                          <li>Buka website di browser <strong>Safari</strong>.</li>
                          <li>Ketuk tombol <strong>Bagikan (Share ⎋)</strong> di bilah bawah.</li>
                          <li>Pilih <strong>&quot;Tambah ke Layar Utama&quot; (+)</strong> lalu ketuk Tambah.</li>
                        </ol>
                      </div>

                      <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: 12, border: '1px solid var(--border-light)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#7C3AED' }}>
                          <Icon name="laptop" size={18} />
                          <span>Laptop / PC (Windows &amp; Mac)</span>
                        </div>
                        <ol style={{ fontSize: 12, color: 'var(--text-secondary)', paddingLeft: 18, marginTop: 8, lineHeight: 1.5 }}>
                          <li>Buka di Chrome, Edge, atau Brave.</li>
                          <li>Klik ikon <strong>Install (⊕)</strong> di sebelah kanan address bar browser.</li>
                          <li>Atau klik menu (⋮) &gt; <strong>&quot;Pasang Money Management&quot;</strong>.</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
