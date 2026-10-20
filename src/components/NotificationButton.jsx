import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';
import { usePrivacy } from '../context/PrivacyContext';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendPushNotification,
  openWhatsAppReminder,
} from '../lib/notifications';

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    icon: 'warning',
    color: '#E11D48',
    bg: '#FDE8E8',
    title: 'Anggaran Belanja Terlampaui',
    desc: 'Pengeluaran melebihi batas Rp150.000',
    time: '2 jam lalu',
    unread: true,
  },
  {
    id: 2,
    icon: 'check_circle',
    color: '#059669',
    bg: '#ECFDF5',
    title: 'Tagihan Listrik Dibayar',
    desc: 'Pembayaran Rp350.000 berhasil diproses',
    time: '1 hari lalu',
    unread: true,
  },
  {
    id: 3,
    icon: 'savings',
    color: 'var(--primary)',
    bg: 'var(--primary-50)',
    title: 'Target Tabungan 80%',
    desc: 'Dana darurat hampir mencapai target',
    time: '3 hari lalu',
    unread: false,
  },
];

export default function NotificationButton() {
  const { isHidden, toggle: togglePrivacy } = usePrivacy();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'reminder'
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [permissionStatus, setPermissionStatus] = useState('default');
  const [reminderHour, setReminderHour] = useState('20');
  const [testSent, setTestSent] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const wrapperRef = useRef(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

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

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const markItemRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  const handleEnablePermission = async () => {
    const res = await requestNotificationPermission();
    setPermissionStatus(getNotificationPermission());
    setFeedbackMsg(res.message);
    if (res.success) {
      sendPushNotification({
        title: '🎉 Notifikasi HP Berhasil Aktif!',
        body: 'Money Management siap mengingatkanmu mencatat keuangan setiap hari.',
      });
    }
    setTimeout(() => setFeedbackMsg(''), 4500);
  };

  const handleTestNotification = () => {
    const ok = sendPushNotification({
      title: '⏰ Pengingat Catat Keuangan',
      body: 'Sudah ada pengeluaran atau pemasukan hari ini? Yuk buka transaksi dan catat sekarang!',
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
        setFeedbackMsg('Peramban memblokir notifikasi.');
      }
    }
  };

  const handleHourChange = (e) => {
    const h = e.target.value;
    setReminderHour(h);
    localStorage.setItem('user_reminder_hour', h);
    setFeedbackMsg(`Jam pengingat disetel ke pukul ${h}:00.`);
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      {/* Tombol Sembunyikan/Tampilkan Semua Nominal (Mode Privasi) - Persis di sebelah Notif */}
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
        title="Pusat Notifikasi & Pengingat HP"
        aria-label="Buka Notifikasi"
      >
        <Icon name="notifications" size={20} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 5,
              right: 5,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#E11D48',
              border: '1.5px solid var(--bg-card)',
              pointerEvents: 'none',
            }}
          />
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
            width: 340,
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
                  onClick={markAllRead}
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
              <Icon name="smartphone" size={14} />
              <span>Pengingat HP 📱</span>
            </button>
          </div>

          {/* Feedback alert if any */}
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

          {/* CONTENT TAB 1: LIST NOTIFIKASI KEUANGAN */}
          {activeTab === 'list' && (
            <div style={{ maxHeight: 310, overflowY: 'auto' }}>
              {/* Quick Prompt to setup phone reminder */}
              <div
                onClick={() => setActiveTab('reminder')}
                style={{
                  padding: '10px 14px',
                  background: 'var(--bg-card2)',
                  borderBottom: '1px solid var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: 'var(--primary-50)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                    flexShrink: 0,
                  }}
                >
                  <Icon name="alarm" size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Pasang Pengingat Catat ke HP
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                    Biar nggak lupa input pengeluaran tiap hari
                  </div>
                </div>
                <Icon name="chevron_right" size={16} style={{ color: 'var(--text-muted)' }} />
              </div>

              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markItemRead(n.id)}
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
                      background: n.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon name={n.icon} size={17} color={n.color} />
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
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{n.time}</div>
                  </div>
                  {n.unread && (
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: '#E11D48',
                        marginTop: 6,
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* CONTENT TAB 2: PENGINGAT HP / WHATSAPP */}
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
                    Pengingat Catat Harian ke HP
                  </span>
                </div>
                <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  Mencegah lupa input pengeluaran dan pemasukan dengan notifikasi langsung di layar HP/komputer dan WhatsApp Anda.
                </p>
              </div>

              {/* Status Izin Notifikasi */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: 'var(--bg-card2)',
                  borderRadius: 10,
                  marginBottom: 12,
                  fontSize: 11.5,
                }}
              >
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Status Izin HP / Browser:
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
                  {permissionStatus === 'granted'
                    ? '✓ Aktif'
                    : permissionStatus === 'denied'
                    ? '✕ Diblokir'
                    : 'Belum Aktif'}
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
                  Jadwal Pengingat Rutin Harian:
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
                {permissionStatus !== 'granted' && (
                  <button
                    type="button"
                    onClick={handleEnablePermission}
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
                    }}
                  >
                    <Icon name="notifications" size={16} />
                    <span>Aktifkan Notifikasi HP / Browser</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleTestNotification}
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
                  <Icon name="send" size={15} />
                  <span>{testSent ? '✓ Terkirim!' : 'Tes Notifikasi ke Layar Sekarang'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => openWhatsAppReminder()}
                  style={{
                    background: '#25D366',
                    color: '#FFFFFF',
                    border: 'none',
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
                  <Icon name="chat" size={15} />
                  <span>💬 Setel Pengingat ke WhatsApp</span>
                </button>
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
