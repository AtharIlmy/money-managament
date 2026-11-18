'use client';
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePWA } from '../context/PWAContext';
import Icon from './Icon';
import Logo from './Logo';

const NAV_ITEMS = [
  { href: '/dasbor', icon: 'grid_view', label: 'Dasbor' },
  { href: '/transaksi', icon: 'swap_vert', label: 'Transaksi' },
  { href: '/anggaran', icon: 'pie_chart', label: 'Anggaran' },
  { href: '/laporan', icon: 'bar_chart', label: 'Laporan' },
  { href: '/dompet', icon: 'account_balance_wallet', label: 'Dompet' },
  { href: '/dana-darurat', icon: 'shield', label: 'Dana Darurat' },
  { href: '/kalender-harian', icon: 'calendar_month', label: 'Kalender Harian' },
];

export default function Sidebar({ isOpen = false, onClose }) {
  const { user } = useAuth();
  const { openInstallModal, isInstalled } = usePWA();
  const navigate = useNavigate();

  const handleProfileClick = () => {
    onClose?.();
    navigate('/pengaturan');
  };

  const handleNavClick = () => {
    onClose?.();
  };

  const userName = user?.name || 'Muhammad';
  const displayUserName = userName.length > 12 ? `${userName.slice(0, 10)}...` : userName;
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'MA';

  return (
    <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
      {/* Top Logo & App Name */}
      <div className="sidebar-logo">
        <NavLink to="/dasbor" onClick={handleNavClick} className="sidebar-logo-link">
          <Logo size={26} rx={18} />
          <span className="sidebar-brand-name">
            Money Management
          </span>
        </NavLink>

        {/* Mobile close button */}
        <button
          type="button"
          className="sidebar-close-btn"
          onClick={onClose}
          aria-label="Tutup Menu"
        >
          <Icon name="close" size={20} />
        </button>
      </div>

      {/* Main Navigation (RUANG KEUANGAN) */}
      <nav className="sidebar-nav">
        <div className="nav-label">RUANG KEUANGAN</div>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={handleNavClick}
            id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {({ isActive }) => (
              <>
                <Icon
                  name={item.icon}
                  size={18}
                  style={{ color: isActive ? '#FFFFFF' : '#8A99AD' }}
                />
                <span className="nav-item-label">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Quote / Motivation Box */}
      <div className="sidebar-quote-card">
        <div className="sidebar-quote-icon">
          <Icon name="auto_awesome" size={17} style={{ color: '#8A99AD' }} />
        </div>
        <div className="sidebar-quote-title">
          Sedikit demi sedikit.
        </div>
        <div className="sidebar-quote-desc">
          Kebiasaan kecil hari ini, ketenangan finansial nanti.
        </div>
      </div>

      {/* Lower Menu: Pengaturan, Pusat Bantuan, Unduh Aplikasi */}
      <div className="sidebar-lower-menu">
        <NavLink
          to="/pengaturan"
          onClick={handleNavClick}
          id="nav-pengaturan"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          {({ isActive }) => (
            <>
              <Icon
                name="settings"
                size={18}
                style={{ color: isActive ? '#FFFFFF' : '#8A99AD' }}
              />
              <span className="nav-item-label">Pengaturan</span>
            </>
          )}
        </NavLink>

        <button
          type="button"
          className="nav-item sidebar-help-btn"
          onClick={() => {
            onClose?.();
            navigate('/pengaturan');
          }}
          title="Pusat Bantuan & Panduan"
        >
          <Icon name="help_outline" size={18} style={{ color: '#8A99AD' }} />
          <span className="nav-item-label">Pusat bantuan</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onClose?.();
            openInstallModal();
          }}
          id="sidebar-download-app-btn"
          className="nav-item"
          title="Download & Pasang Aplikasi ke Perangkat"
        >
          <Icon name="download" size={18} style={{ color: '#8A99AD' }} />
          <span className="nav-item-label">Unduh Aplikasi</span>
        </button>
      </div>

      {/* User Footer */}
      <div className="sidebar-footer">
        <div
          className="sidebar-user"
          onClick={handleProfileClick}
          id="sidebar-profile-link"
          title="Buka Profil & Pengaturan"
        >
          <div className="user-avatar">
            {initials}
          </div>
          <div className="user-info">
            <div className="user-name">{displayUserName}</div>
            <div className="user-email">Akun personal</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
