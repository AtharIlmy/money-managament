import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePWA } from '../context/PWAContext';
import Icon from './Icon';
import Logo from './Logo';

const NAV_ITEMS = [
  { href: '/dasbor', icon: 'grid_view', label: 'Dasbor' },
  { href: '/transaksi', icon: 'swap_vert', label: 'Transaksi' },
  { href: '/dompet', icon: 'account_balance_wallet', label: 'Dompet' },
  { href: '/anggaran', icon: 'pie_chart', label: 'Anggaran' },
  { href: '/tabungan', icon: 'savings', label: 'Tabungan' },
  { href: '/tagihan', icon: 'receipt_long', label: 'Tagihan' },
  { href: '/dana-darurat', icon: 'shield', label: 'Dana Darurat' },
  { href: '/laporan', icon: 'bar_chart', label: 'Laporan' },
];

export default function Sidebar({ isOpen = false, onClose }) {
  const { user, logout } = useAuth();
  const { openInstallModal, isInstalled } = usePWA();
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e?.stopPropagation?.();
    onClose?.();
    logout();
    navigate('/masuk');
  };

  const handleProfileClick = () => {
    onClose?.();
    navigate('/pengaturan');
  };

  const handleNavClick = () => {
    onClose?.();
  };

  const userName = user?.name || 'Nadia Putri';
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <NavLink
          to="/dasbor"
          onClick={handleNavClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 11,
            textDecoration: 'none',
          }}
        >
          <Logo
            size={38}
            rx={26}
            style={{
              boxShadow: '0 3px 12px rgba(11,23,40,0.25)',
              borderRadius: 11,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: '-0.35px',
              color: 'var(--text-primary)',
              lineHeight: 1.15,
              whiteSpace: 'nowrap',
            }}
          >
            Money Management
          </span>
        </NavLink>
        {/* Mobile close button */}
        <button
          type="button"
          className="sidebar-close-btn"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: 4,
            display: 'none', // Shown on <= 768px via CSS
          }}
          aria-label="Tutup Menu"
        >
          <Icon name="close" size={22} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-label">RUANG KEUANGAN</div>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={handleNavClick}
            id={`nav-${item.label.toLowerCase()}`}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            style={({ isActive }) =>
              isActive
                ? {
                    background: 'var(--nav-active-bg)',
                    color: 'var(--nav-active-color)',
                    fontWeight: 700,
                    boxShadow: 'none',
                    border: '1px solid var(--nav-active-border)',
                  }
                : {}
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  name={item.icon}
                  size={18}
                  style={{ color: isActive ? 'var(--nav-active-color)' : 'var(--text-secondary)' }}
                />
                <span>{item.label}</span>
                {isActive && (
                  <span style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--nav-active-color)' }}>
                    ●
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Quote Card */}
      <div className="sidebar-quote-card">
        <div style={{ marginBottom: 4 }}>
          <Icon name="spa" size={18} style={{ color: 'var(--primary)' }} />
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--primary)' }}>
          Sedikit demi sedikit.
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4 }}>
          Kebiasaan kecil hari ini, ketenangan finansial nanti.
        </div>
      </div>

      {/* Settings & Help */}
      <div style={{ padding: '0 14px 10px' }}>

        <NavLink
          to="/pengaturan"
          onClick={handleNavClick}
          id="nav-pengaturan"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          style={({ isActive }) =>
            isActive
              ? {
                  background: 'var(--nav-active-bg)',
                  color: 'var(--nav-active-color)',
                  fontWeight: 700,
                  boxShadow: 'none',
                  border: '1px solid var(--nav-active-border)',
                  padding: '7px 12px',
                  fontSize: 13,
                  marginBottom: 2,
                }
              : {
                  padding: '7px 12px',
                  fontSize: 13,
                  marginBottom: 2,
                }
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                name="settings"
                size={17}
                style={{ color: isActive ? 'var(--nav-active-color)' : 'var(--text-secondary)' }}
              />
              <span>Pengaturan</span>
              {isActive && (
                <span style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--nav-active-color)' }}>
                  ●
                </span>
              )}
            </>
          )}
        </NavLink>
        <NavLink
          to="/bantuan"
          onClick={handleNavClick}
          id="nav-bantuan"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          style={({ isActive }) =>
            isActive
              ? {
                  background: 'var(--nav-active-bg)',
                  color: 'var(--nav-active-color)',
                  fontWeight: 700,
                  boxShadow: 'none',
                  border: '1px solid var(--nav-active-border)',
                  padding: '7px 12px',
                  fontSize: 13,
                  marginBottom: 2,
                }
              : {
                  padding: '7px 12px',
                  fontSize: 13,
                  marginBottom: 2,
                }
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                name="help"
                size={17}
                style={{ color: isActive ? 'var(--nav-active-color)' : 'var(--text-secondary)' }}
              />
              <span>Pusat bantuan</span>
              {isActive && (
                <span style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--nav-active-color)' }}>
                  ●
                </span>
              )}
            </>
          )}
        </NavLink>
        <button
          type="button"
          onClick={() => {
            onClose?.();
            openInstallModal();
          }}
          id="sidebar-download-app-btn"
          className="nav-item"
          style={{
            width: '100%',
            padding: '7px 12px',
            fontSize: 13,
            marginBottom: 2,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: 'var(--text-secondary)',
            borderRadius: 'var(--radius-sm, 8px)',
            transition: 'background 0.15s, color 0.15s',
          }}
          title="Download & Pasang Aplikasi ke Perangkat"
        >
          <Icon name="download" size={17} style={{ color: '#0284C7' }} />
          <span>{isInstalled ? 'Aplikasi Terpasang' : 'Download Aplikasi'}</span>
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: 6,
              background: isInstalled ? 'rgba(74, 227, 181, 0.18)' : 'rgba(82, 181, 253, 0.18)',
              color: isInstalled ? '#059669' : '#0284C7',
            }}
          >
            {isInstalled ? 'Aktif' : 'App'}
          </span>
        </button>
      </div>

      {/* User Footer */}
      <div className="sidebar-footer">
        <div
          className="sidebar-user"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px' }}
        >
          {/* User Profile (Click goes to Profile / Settings) */}
          <div
            onClick={handleProfileClick}
            id="sidebar-profile-link"
            title="Klik untuk membuka Profil & Pengaturan"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flex: 1,
              minWidth: 0,
              cursor: 'pointer',
              borderRadius: 8,
              padding: '4px',
              transition: 'opacity 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <div
              className="user-avatar"
              style={{
                background: 'var(--avatar-bg)',
                color: 'var(--nav-active-color)',
                fontWeight: 800,
                fontSize: 12,
                border: '1px solid var(--avatar-border)',
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div className="user-info" style={{ minWidth: 0 }}>
              <div className="user-name">{userName}</div>
              <div className="user-email">Akun personal</div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            id="sidebar-logout-btn"
            title="Klik untuk Keluar (Logout)"
            aria-label="Logout"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: 8,
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 4,
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--danger)';
              e.currentTarget.style.background = 'var(--danger-bg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <Icon name="logout" size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
