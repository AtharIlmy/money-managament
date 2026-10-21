import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';
import { usePWA } from '../context/PWAContext';
import Sidebar from './Sidebar';
import Icon from './Icon';
import NotificationButton from './NotificationButton';
import { initDailyReminderScheduler } from '../lib/notifications';
import Logo from './Logo';

const MOBILE_BOTTOM_NAV = [
  { href: '/dasbor', icon: 'grid_view', label: 'Dasbor' },
  { href: '/transaksi', icon: 'swap_vert', label: 'Transaksi' },
  { href: '/dompet', icon: 'account_balance_wallet', label: 'Dompet' },
  { href: '/anggaran', icon: 'pie_chart', label: 'Anggaran' },
  { href: '/pengaturan', icon: 'settings', label: 'Setelan' },
];

export default function Layout() {
  const { isAuthenticated, loading } = useAuth();
  const { isHidden, toggle: togglePrivacy } = usePrivacy();
  const { openInstallModal, isInstalled } = usePWA();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Initialize reminder scheduler for device
  useEffect(() => {
    initDailyReminderScheduler();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg)',
        color: 'var(--primary)',
        fontFamily: 'Inter, sans-serif',
        fontSize: '16px',
        fontWeight: '500'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Logo size={52} rx={26} style={{ margin: '0 auto 16px', boxShadow: '0 4px 16px rgba(11,23,40,0.25)', borderRadius: 14 }} />
          <div>Memuat Money Management...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/masuk" replace />;
  }

  return (
    <div className="app-layout">
      {/* Mobile Top Header (Visible only on <= 768px screens) */}
      <header className="mobile-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            className="mobile-hamburger-btn"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Buka Menu Navigasi"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 6,
              borderRadius: 8,
            }}
          >
            <Icon name="menu" size={24} />
          </button>

          <NavLink
            to="/dasbor"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none',
            }}
          >
            <Logo size={30} rx={24} style={{ borderRadius: 8, flexShrink: 0 }} />
            <span
              style={{
                fontSize: 15,
                fontWeight: 800,
                letterSpacing: '-0.35px',
                color: 'var(--text-primary)',
              }}
            >
              Money Management
            </span>
          </NavLink>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {!isInstalled && (
            <button
              type="button"
              onClick={openInstallModal}
              aria-label="Download Aplikasi"
              style={{
                background: 'rgba(82, 181, 253, 0.12)',
                border: '1px solid rgba(82, 181, 253, 0.28)',
                color: '#0284C7',
                borderRadius: 8,
                padding: '5px 9px',
                fontSize: 12,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
              }}
              title="Download Aplikasi"
            >
              <Icon name="download" size={15} />
              <span>Unduh App</span>
            </button>
          )}
          {/* Privacy Eye Toggle on Mobile */}
          <button
            type="button"
            onClick={togglePrivacy}
            aria-label={isHidden ? "Tampilkan Saldo" : "Sembunyikan Saldo"}
            title={isHidden ? "Tampilkan Saldo" : "Sembunyikan Saldo"}
            style={{
              background: 'transparent',
              border: 'none',
              color: isHidden ? '#2563EB' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 6,
              borderRadius: 8,
              transition: 'all 0.15s ease',
            }}
          >
            <Icon name={isHidden ? 'visibility_off' : 'visibility'} size={20} />
          </button>
          <NotificationButton />
        </div>
      </header>

      {/* Backdrop overlay for mobile drawer */}
      {mobileSidebarOpen && (
        <div
          className="mobile-sidebar-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar with mobile open state */}
      <Sidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Page Area */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar (Visible only on <= 768px screens) */}
      <nav className="mobile-bottom-nav" aria-label="Navigasi Bawah Mobile">
        {MOBILE_BOTTOM_NAV.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) => `mobile-bottom-item ${isActive ? 'active' : ''}`}
            onClick={() => setMobileSidebarOpen(false)}
          >
            {({ isActive }) => (
              <>
                <Icon
                  name={item.icon}
                  size={20}
                  style={{
                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                    transition: 'transform 0.15s ease',
                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                  }}
                />
                <span>{item.label}</span>
                {isActive && (
                  <span
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      marginTop: -1,
                    }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
