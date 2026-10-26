import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';
import { usePrivacy } from '../context/PrivacyContext';
import {
  getInAppNotifications,
  addInAppNotification,
  markNotificationRead,
  markAllNotificationsRead,
  clearAllInAppNotifications,
  getNotificationPermission,
  requestNotificationPermission,
  sendPushNotification,
  scheduleLockScreenTestNotification,
} from '../lib/notifications';

export default function NotificationButton() {
  const { isHidden, toggle: togglePrivacy } = usePrivacy();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'reminder'
  const [notifications, setNotifications] = useState([]);
  const [permissionStatus, setPermissionStatus] = useState('default');
  const [reminderHour, setReminderHour] = useState('20');
  const [testSent, setTestSent] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const wrapperRef = useRef(null);

  // Sync notifications from localStorage & listen to custom change events
  useEffect(() => {
    const loadNotifs = () => {
      setNotifications(getInAppNotifications());
    };
    loadNotifs();

    window.addEventListener('in-app-notification-changed', loadNotifs);
    return () => {
      window.removeEventListener('in-app-notification-changed', loadNotifs);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPermissionStatus(getNotificationPermission());
      const savedHour = localStorage.getItem('user_reminder_hour') || '20';
      setReminderHour(savedHour);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
  };

  const handleClearAll = () => {
    clearAllInAppNotifications();
  };

  const handleItemClick = (n) => {
    markNotificationRead(n.id);
    if (n.url && typeof window !== 'undefined') {
      setIsOpen(false);
      window.location.href = n.url;
    }
  };

  const handleEnablePermission = async () => {
    const res = await requestNotificationPermission();
    setPermissionStatus(getNotificationPermission());
    setFeedbackMsg(res.message);
    if (res.success) {
      sendPushNotification({
        title: '🎉 Notifikasi Layar Berhasil Aktif!',
        body: 'Money Management siap mengingatkanmu mencatat keuangan setiap hari.',
      });
    }
    setTimeout(() => setFeedbackMsg(''), 4500);
  };

  const handleTestInApp = () => {
    addInAppNotification({
      title: '🔔 Uji Coba Notifikasi In-App',
      desc: 'Notifikasi langsung di dalam aplikasi (ikon lonceng) bekerja 100% dengan lancar!',
      icon: 'notifications_active',
      color: '#2563EB',
      bg: '#EFF6FF',
      url: '/dasbor',
    });
    setFeedbackMsg('Notifikasi baru berhasil ditambahkan ke ikon lonceng!');
    setTimeout(() => setFeedbackMsg(''), 3500);
  };

  const handleTestDeviceNotification = () => {
    const ok = sendPushNotification({
      title: '⏰ Pengingat Catat Keuangan',
      body: 'Sudah ada transaksi hari ini? Buka aplikasi dan catat sekarang!',
      url: '/transaksi',
    });
    if (ok) {
      setTestSent(true);
      setFeedbackMsg('Notifikasi terkirim ke layar perangkat Anda!');
      setTimeout(() => {
        setTestSent(false);
        setFeedbackMsg('');
      }, 4000);
    } else {
      if (permissionStatus !== 'granted') {
        handleEnablePermission();
      } else {
        setFeedbackMsg('Izin notifikasi layar belum aktif atau diblokir.');
        setTimeout(() => setFeedbackMsg(''), 4000);
      }
    }
  };

  const [lockCountdown, setLockCountdown] = useState(null);

  const handleTestLockScreen = async () => {
    if (permissionStatus !== 'granted') {
      const res = await requestNotificationPermission();
      setPermissionStatus(getNotificationPermission());
      if (!res.success) {
        setFeedbackMsg('Mohon izinkan notifikasi terlebih dahulu agar dapat muncul di lock screen.');
        setTimeout(() => setFeedbackMsg(''), 4500);
        return;
      }
    }

    setFeedbackMsg('🔒 KUNCI LAYAR HP KAMU SEKARANG! Notifikasi akan muncul di lock screen...');
    scheduleLockScreenTestNotification(4, (seconds) => {
      setLockCountdown(seconds);
      if (seconds === 0) {
        setLockCountdown(null);
        setFeedbackMsg('✓ Notifikasi telah dikirim ke Lock Screen HP!');
        setTimeout(() => setFeedbackMsg(''), 5000);
      }
    });
  };

  const handleHourChange = (e) => {
    const h = e.target.value;
    setReminderHour(h);
    localStorage.setItem('user_reminder_hour', h);
    setFeedbackMsg(`Jadwal pengingat disetel ke pukul ${h}:00 WIB.`);
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      {/* Mode Privasi Nominal */}
      <button
        type="button"
        onClick={togglePrivacy}
        id="privacy-hide-nominal-btn"
        title={isHidden ? 'Tampilkan semua nominal' : 'Sembunyikan semua nominal (Mode Privasi)'}
        aria-label="Toggle privasi nominal"
        style={{
          background: isHidden ? 'rgba(5, 150, 105, 0.12)' : 'transparent',
          border: isHidden ? '1px solid rgba(5, 150, 105, 0.4)' : '1px solid var(--border)',
          borderRadius: 8,
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: isHidden ? '#059669' : 'var(--text-secondary)',
          transition: 'all 0.15s ease',
          flexShrink: 0,
        }}
      >
        <Icon name={isHidden ? 'visibility_off' : 'visibility'} size={19} />
      </button>

      {/* Wrapper Dropdown Notifikasi */}
      <div ref={wrapperRef} style={{ position: 'relative', display: 'inline-block', zIndex: 100 }}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          style={{
            background: isOpen ? 'var(--primary-50)' : 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: 8,
            position: 'relative',
            transition: 'all 0.15s ease',
          }}
          title="Pusat Notifikasi Aplikasi"
          aria-label="Buka Notifikasi"
        >
          <Icon name="notifications" size={20} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 5,
                right: 5,
                minWidth: 16,
                height: 16,
                padding: '0 4px',
                borderRadius: 999,
                background: '#E11D48',
                border: '2px solid var(--bg-card)',
                color: '#FFFFFF',
                fontSize: 9.5,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              background: 'var(--bg-card)',
              borderRadius: 14,
              boxShadow: '0 12px 36px rgba(14, 32, 56, 0.22), 0 4px 12px rgba(0, 0, 0, 0.1)',
              border: '1px solid var(--border)',
              zIndex: 9999,
              width: 350,
              maxWidth: 'calc(100vw - 32px)',
              overflow: 'hidden',
              animation: 'fadeIn 0.15s ease-out',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-light)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--bg-card2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Pusat Notifikasi
                </span>
                {unreadCount > 0 && activeTab === 'list' && (
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: 999,
                      background: '#E11D48',
                      color: '#FFFFFF',
                    }}
                  >
                    {unreadCount} baru
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {activeTab === 'list' && unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--primary)',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Tandai dibaca
                  </button>
                )}
                {activeTab === 'list' && notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: 11,
                      fontWeight: 500,
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>

            {/* Tab Switcher */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                background: 'var(--bg-card2)',
                borderBottom: '1px solid var(--border-light)',
                padding: '4px',
                gap: 4,
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                style={{
                  padding: '6px 10px',
                  border: 'none',
                  borderRadius: 8,
                  background: activeTab === 'list' ? 'var(--bg-card)' : 'transparent',
                  color: activeTab === 'list' ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'list' ? 700 : 500,
                  fontSize: 11.5,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  boxShadow: activeTab === 'list' ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <Icon name="notifications" size={14} />
                <span>Pemberitahuan</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('reminder')}
                style={{
                  padding: '6px 10px',
                  border: 'none',
                  borderRadius: 8,
                  background: activeTab === 'reminder' ? 'var(--bg-card)' : 'transparent',
                  color: activeTab === 'reminder' ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'reminder' ? 700 : 500,
                  fontSize: 11.5,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  boxShadow: activeTab === 'reminder' ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <Icon name="tune" size={14} />
                <span>Pengaturan &amp; Tes</span>
              </button>
            </div>

            {/* Feedback alert */}
            {feedbackMsg && (
              <div
                style={{
                  padding: '8px 14px',
                  background: 'var(--primary-50)',
                  color: 'var(--primary)',
                  fontSize: 11.5,
                  fontWeight: 600,
                  borderBottom: '1px solid var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Icon name="info" size={14} />
                <span>{feedbackMsg}</span>
              </div>
            )}

            {/* TAB 1: LIST NOTIFIKASI IN-APP */}
            {activeTab === 'list' && (
              <div style={{ maxHeight: 330, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: 'var(--primary-50)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 10px',
                      }}
                    >
                      <Icon name="notifications_none" size={24} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      Belum Ada Notifikasi
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
                      Pemberitahuan transaksi dan peringatan otomatis akan tercatat di sini.
                    </div>
                    <button
                      type="button"
                      onClick={handleTestInApp}
                      style={{
                        marginTop: 12,
                        background: 'var(--primary)',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 8,
                        padding: '6px 14px',
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Kirim Notifikasi Tes
                    </button>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleItemClick(n)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border-light)',
                        background: n.unread ? 'var(--primary-50)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                    >
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          background: n.bg || 'var(--primary-50)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Icon name={n.icon || 'notifications'} size={17} color={n.color || 'var(--primary)'} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 12.5,
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            marginBottom: 2,
                          }}
                        >
                          {n.title}
                        </div>
                        <div
                          style={{
                            fontSize: 11.5,
                            color: 'var(--text-secondary)',
                            marginBottom: 4,
                            lineHeight: 1.35,
                          }}
                        >
                          {n.desc}
                        </div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{n.time || 'Baru saja'}</div>
                      </div>
                      {n.unread && (
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: '#E11D48',
                            marginTop: 6,
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 2: PENGATURAN NOTIFIKASI LANGSUNG (IN-APP) */}
            {activeTab === 'reminder' && (
              <div style={{ padding: '16px', maxHeight: 340, overflowY: 'auto' }}>
                <div
                  style={{
                    background: 'var(--bg-card2)',
                    borderRadius: 12,
                    padding: '12px',
                    marginBottom: 14,
                    border: '1px solid var(--border-light)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Icon name="notifications_active" size={17} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                      Notifikasi Langsung di Aplikasi 🔔
                    </span>
                  </div>
                  <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                    Setiap transaksi dan pengingat harian tercatat langsung di ikon lonceng ini dan popup layar tanpa melalui pihak ketiga.
                  </p>
                </div>

                {/* Status Lonceng In-App */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    background: 'var(--bg-card2)',
                    borderRadius: 10,
                    marginBottom: 8,
                    fontSize: 11.5,
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Lonceng Aplikasi:
                  </span>
                  <span
                    style={{
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: 'var(--income-bg, #DCFCE7)',
                      color: 'var(--income-color, #16A34A)',
                    }}
                  >
                    ✓ Selalu Aktif
                  </span>
                </div>

                {/* Status Izin Notifikasi Layar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    background: 'var(--bg-card2)',
                    borderRadius: 10,
                    marginBottom: 12,
                    fontSize: 11.5,
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Notifikasi Layar Perangkat:
                  </span>
                  <span
                    style={{
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 6,
                      background:
                        permissionStatus === 'granted'
                          ? 'var(--income-bg, #DCFCE7)'
                          : 'var(--expense-bg, #FEE2E2)',
                      color:
                        permissionStatus === 'granted'
                          ? 'var(--income-color, #16A34A)'
                          : 'var(--expense-color, #DC2626)',
                    }}
                  >
                    {permissionStatus === 'granted' ? '✓ Aktif' : 'Belum Aktif'}
                  </span>
                </div>

                {/* Form Jam Pengingat */}
                <div style={{ marginBottom: 14 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      marginBottom: 5,
                    }}
                  >
                    Jadwal Pengingat Harian (Jika Belum Catat):
                  </label>
                  <select
                    value={reminderHour}
                    onChange={handleHourChange}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    <option value="12">Pukul 12:00 Siang (Setelah Makan Siang)</option>
                    <option value="18">Pukul 18:00 Sore (Setelah Selesai Beraktivitas)</option>
                    <option value="20">Pukul 20:00 Malam (Evaluasi Santai)</option>
                    <option value="21">Pukul 21:00 Malam (Sebelum Tidur)</option>
                  </select>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    type="button"
                    onClick={handleTestInApp}
                    style={{
                      background: 'var(--primary)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 9,
                      padding: '9px 12px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      transition: 'all 0.15s',
                    }}
                  >
                    <Icon name="notifications" size={16} />
                    <span>🔔 Tes Kirim ke Lonceng Sekarang</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestLockScreen}
                    disabled={lockCountdown !== null}
                    style={{
                      background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                      color: '#38BDF8',
                      border: '1.5px solid #38BDF8',
                      borderRadius: 9,
                      padding: '9px 12px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: lockCountdown !== null ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
                    }}
                  >
                    <Icon name="screen_lock_portrait" size={16} />
                    <span>
                      {lockCountdown !== null
                        ? `⏳ Kunci Layar HP Sekarang (${lockCountdown}s)...`
                        : '🔒 Tes Muncul di Lock Screen HP'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestDeviceNotification}
                    style={{
                      background: 'var(--primary-50)',
                      color: 'var(--primary)',
                      border: '1px solid var(--primary-light)',
                      borderRadius: 9,
                      padding: '8px 12px',
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <Icon name="smartphone" size={15} />
                    <span>{testSent ? '✓ Terkirim ke Layar!' : '📱 Tes Notifikasi Layar Aktif'}</span>
                  </button>

                  {permissionStatus !== 'granted' && (
                    <button
                      type="button"
                      onClick={handleEnablePermission}
                      style={{
                        background: 'transparent',
                        color: 'var(--text-secondary)',
                        border: '1px dashed var(--border)',
                        borderRadius: 9,
                        padding: '8px 12px',
                        fontSize: 11.5,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <Icon name="check" size={15} />
                      <span>Izinkan Notifikasi Layar Perangkat</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            <div
              style={{
                padding: '9px 16px',
                textAlign: 'center',
                fontSize: 11.5,
                color: 'var(--text-secondary)',
                fontWeight: 600,
                background: 'var(--bg-card2)',
                borderTop: '1px solid var(--border-light)',
                cursor: 'pointer',
              }}
              onClick={() => setIsOpen(false)}
            >
              Tutup
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
