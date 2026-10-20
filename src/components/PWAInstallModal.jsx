import React from 'react';
import { usePWA } from '../context/PWAContext';
import Logo from './Logo';
import Icon from './Icon';

export default function PWAInstallModal() {
  const {
    showInstallModal,
    closeInstallModal,
    deferredPrompt,
    isInstalled,
    isIOS,
    installApp,
  } = usePWA();

  if (!showInstallModal) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(5, 12, 22, 0.75)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
      onClick={closeInstallModal}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 460,
          background: 'var(--card-bg, #FFFFFF)',
          borderRadius: 20,
          border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          position: 'relative',
          animation: 'fadeInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0B1728 0%, #132742 100%)',
            padding: '24px 24px 20px',
            color: '#FFFFFF',
            position: 'relative',
          }}
        >
          <button
            type="button"
            onClick={closeInstallModal}
            aria-label="Tutup"
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'rgba(255,255,255,0.12)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <Icon name="close" size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Logo size={52} rx={26} style={{ borderRadius: 14, flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    padding: '2px 8px',
                    borderRadius: 12,
                    background: 'rgba(74, 227, 181, 0.2)',
                    color: '#4AE3B5',
                  }}
                >
                  PWA App • Gratis
                </span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>v1.0.0</span>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: '4px 0 2px', color: '#FFFFFF' }}>
                Money Management
              </h3>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                Kelola Keuangan Pribadi & Catatan Harian
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px 24px' }}>
          {isInstalled ? (
            <div
              style={{
                textAlign: 'center',
                padding: '24px 16px',
                background: 'rgba(74, 227, 181, 0.1)',
                borderRadius: 14,
                border: '1px solid rgba(74, 227, 181, 0.3)',
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                Aplikasi Sudah Terpasang!
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                Money Management sudah terpasang di perangkat Anda. Anda dapat membukanya langsung dari layar depan / menu aplikasi.
              </div>
            </div>
          ) : isIOS ? (
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
                Cara Unduh & Pasang di iPhone / iPad (Safari):
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  background: 'var(--bg-secondary, #F8FAFC)',
                  padding: '16px',
                  borderRadius: 14,
                  border: '1px solid var(--border-color, rgba(0,0,0,0.06))',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: 'var(--primary, #0B1728)',
                      color: '#FFF',
                      fontSize: 12,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    1
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    Ketuk tombol <strong>Bagikan (Share)</strong> <span style={{ fontSize: 15 }}>⎋</span> di bilah bawah browser Safari.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: 'var(--primary, #0B1728)',
                      color: '#FFF',
                      fontSize: 12,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    2
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    Gulir ke bawah pada menu, lalu pilih <strong>&quot;Tambah ke Layar Utama&quot; (Add to Home Screen)</strong> ➕.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: 'var(--primary, #0B1728)',
                      color: '#FFF',
                      fontSize: 12,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    3
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    Ketuk <strong>&quot;Tambah&quot; (Add)</strong> di pojok kanan atas layar. Selesai! Ikon aplikasi akan muncul di home screen.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Feature Highlights */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: 'rgba(74, 227, 181, 0.12)',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon name="bolt" size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      Akses Super Cepat & Ringan
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      Ukuran hanya ~2 MB, langsung buka tanpa beban memori HP.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: 'rgba(82, 181, 253, 0.12)',
                      color: '#0284C7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon name="notifications_active" size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      Notifikasi Pengingat Rutin
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      Pengingat otomatis jam 20:00 WIB untuk catat pengeluaran.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: 'rgba(139, 92, 246, 0.12)',
                      color: '#7C3AED',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon name="smartphone" size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      Layar Penuh Seperti App Asli
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      Bebas dari bilah navigasi browser, terasa seperti aplikasi Play Store.
                    </div>
                  </div>
                </div>
              </div>

              {/* Install Action Button */}
              {deferredPrompt ? (
                <button
                  type="button"
                  onClick={installApp}
                  style={{
                    width: '100%',
                    padding: '13px 18px',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #0B1728 0%, #1A365D 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(11, 23, 40, 0.3)',
                    transition: 'all 0.2s',
                  }}
                >
                  <Icon name="download" size={20} style={{ color: '#4AE3B5' }} />
                  <span>Download & Pasang Sekarang</span>
                </button>
              ) : (
                <div
                  style={{
                    background: 'var(--bg-secondary, #F8FAFC)',
                    padding: '14px 16px',
                    borderRadius: 12,
                    border: '1px solid var(--border-color, rgba(0,0,0,0.06))',
                    fontSize: 12.5,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    textAlign: 'center',
                  }}
                >
                  💡 <strong>Cara Memasang:</strong> Di browser Chrome/Edge, klik ikon <strong>Install (⊕)</strong> di bagian kanan bilah alamat (address bar) atau buka menu <strong>(⋮) &gt; &quot;Pasang Money Management&quot;</strong>.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
